import json
import os
import re
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.car import Car
from app.schemas.ai_chat import AiChatRequest, AiChatResponse

router = APIRouter(prefix="/ai", tags=["AI Chat"])

SYSTEM_PROMPT = (
    "Bạn là trợ lý AI trên website thuê xe Phương Đông. "
    "Hãy trả lời hữu ích, tự nhiên bằng tiếng Việt nếu người dùng hỏi tiếng Việt. "
    "Bạn có thể trả lời cả câu hỏi không liên quan đến thuê xe. "
    "Khi trả lời về dữ liệu website, chỉ dùng dữ liệu được cung cấp trong ngữ cảnh, không tự bịa xe, giá hoặc trạng thái. "
    "Trả lời ngắn gọn, dễ đọc, không dùng markdown in đậm."
)


def _system_prompt(website_context: str = "") -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    context = f"\n\nDữ liệu website hiện tại:\n{website_context}" if website_context else ""
    return f"{SYSTEM_PROMPT} Ngày hiện tại của hệ thống là {today}.{context}"


def _money(value) -> str:
    try:
        return f"{int(float(value or 0)):,}".replace(",", ".") + " VND/ngày"
    except Exception:
        return "Chưa cập nhật giá"


def _car_status_label(status: str | None) -> str:
    status_value = (status or "").strip().lower()
    if status_value == "available":
        return "còn xe"
    if status_value == "rented":
        return "đang được thuê"
    if status_value:
        return status_value
    return "chưa cập nhật"


def _build_website_context(db: Session) -> str:
    try:
        cars = db.query(Car).order_by(Car.car_id.asc()).limit(40).all()
    except Exception:
        cars = []

    total_cars = len(cars)
    rented_cars = sum(1 for car in cars if (car.status or "").lower() == "rented")
    available_cars = total_cars - rented_cars
    lines = [
        "Công ty: Công ty Cổ phần TĐ Phương Đông.",
        "Dịch vụ chính: thuê xe tự lái, thuê xe có lái, thuê xe ngắn hạn, dài hạn và cho doanh nghiệp.",
        "Hotline: 0979 402 470.",
        "Email: phuongdongcorp22@gmail.com.",
        "Địa chỉ: 39 Phan Phù Tiên, phường Ô Chợ Dừa, Hà Nội.",
        f"Tổng số xe đang hiển thị: {total_cars}; còn xe: {available_cars}; đang thuê: {rented_cars}.",
    ]

    if cars:
        lines.append("Danh sách xe:")
        for car in cars:
            seats = f"{car.seats} chỗ" if car.seats else "chưa cập nhật số chỗ"
            color = car.color or "chưa cập nhật màu"
            fuel_type = car.fuel_type or "chưa cập nhật loại"
            transmission = car.transmission or "chưa cập nhật hộp số"
            year = car.year or "chưa cập nhật năm"
            description = f" - {car.description}" if car.description else ""
            lines.append(
                f"- ID {car.car_id}: {car.name or 'Xe chưa đặt tên'} ({car.brand or 'chưa cập nhật hãng'}), "
                f"{seats}, {transmission}, loại {fuel_type}, màu {color}, năm {year}, "
                f"giá {_money(car.price_per_day)}, trạng thái {_car_status_label(car.status)}.{description}"
            )
    else:
        lines.append("Chưa lấy được danh sách xe từ cơ sở dữ liệu.")

    return "\n".join(lines)


def _normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFD", value or "")
    return "".join(char for char in text if unicodedata.category(char) != "Mn").lower()


def _extract_openai_chat_text(data: dict) -> str:
    choices = data.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message") or {}
    content = message.get("content")
    return content.strip() if isinstance(content, str) else ""


def _extract_gemini_text(data: dict) -> str:
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = ((candidates[0].get("content") or {}).get("parts")) or []
    return "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()


def _call_gemini(payload: AiChatRequest, api_key: str, system_prompt: str) -> AiChatResponse:
    contents = []
    for item in payload.messages[-8:]:
        if not item.content.strip():
            continue
        role = "model" if item.role == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": item.content}]})
    contents.append({"role": "user", "parts": [{"text": payload.message}]})

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    query = urllib.parse.urlencode({"key": api_key})
    request = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?{query}",
        data=json.dumps(
            {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 700,
                },
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore") or str(error)
        raise HTTPException(status_code=502, detail=f"Gemini API error: {detail}")
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Không thể kết nối Gemini API: {error}")

    reply = _extract_gemini_text(data)
    if not reply:
        raise HTTPException(status_code=502, detail="Gemini API không trả về nội dung hợp lệ.")

    return AiChatResponse(reply=reply, provider="gemini")


def _call_groq(payload: AiChatRequest, api_key: str, system_prompt: str) -> AiChatResponse:
    recent_messages = [
        {"role": item.role, "content": item.content}
        for item in payload.messages[-8:]
        if item.role in {"user", "assistant", "system"} and item.content.strip()
    ]
    messages = [
        {"role": "system", "content": system_prompt},
        *recent_messages,
        {"role": "user", "content": payload.message},
    ]

    body = {
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "messages": messages,
        "temperature": 0.7,
        "max_completion_tokens": 700,
    }
    request = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore") or str(error)
        raise HTTPException(status_code=502, detail=f"Groq API error: {detail}")
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Không thể kết nối Groq API: {error}")

    reply = _extract_openai_chat_text(data)
    if not reply:
        raise HTTPException(status_code=502, detail="Groq API không trả về nội dung hợp lệ.")

    return AiChatResponse(reply=reply, provider="groq")


def _call_openrouter(payload: AiChatRequest, api_key: str, system_prompt: str) -> AiChatResponse:
    recent_messages = [
        {"role": item.role, "content": item.content}
        for item in payload.messages[-8:]
        if item.role in {"user", "assistant", "system"} and item.content.strip()
    ]
    messages = [
        {"role": "system", "content": system_prompt},
        *recent_messages,
        {"role": "user", "content": payload.message},
    ]

    body = {
        "model": os.getenv("OPENROUTER_MODEL", "openrouter/free"),
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 700,
    }
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost:5173"),
            "X-Title": os.getenv("OPENROUTER_SITE_NAME", "Phuong Dong Car Rental"),
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore") or str(error)
        raise HTTPException(status_code=502, detail=f"OpenRouter API error: {detail}")
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Không thể kết nối OpenRouter API: {error}")

    reply = _extract_openai_chat_text(data)
    if not reply:
        raise HTTPException(status_code=502, detail="OpenRouter API không trả về nội dung hợp lệ.")

    return AiChatResponse(reply=reply, provider="openrouter")


def _local_website_reply(payload: AiChatRequest, db: Session) -> AiChatResponse:
    message = (payload.message or "").strip().lower()
    normalized_message = _normalize_text(message)
    cars = db.query(Car).order_by(Car.car_id.asc()).all()
    car_words = ("xe", "thue", "gia", "cho", "vinfast", "mau", "tu lai", "co lai")

    if any(word in normalized_message for word in car_words):
        filtered_cars = cars
        seat_match = None
        seat_result = re.search(r"\b(\d{1,2})\s*ch", normalized_message)
        if seat_result:
            seat_match = int(seat_result.group(1))
        if seat_match:
            filtered_cars = [car for car in filtered_cars if int(car.seats or 0) == seat_match]

        if "con" in normalized_message or "available" in normalized_message or "trong" in normalized_message:
            filtered_cars = [car for car in filtered_cars if (car.status or "").lower() == "available"]

        if not filtered_cars:
            return AiChatResponse(
                provider="local_fallback",
                reply="Hiện hệ thống chưa có xe khớp với yêu cầu đó. Bạn có thể đổi số chỗ, khoảng giá hoặc chuyển sang tab Nhân viên để được tư vấn trực tiếp.",
            )

        lines = ["Mình tìm được các xe phù hợp trong dữ liệu website:"]
        for car in filtered_cars[:6]:
            seats = f"{car.seats} chỗ" if car.seats else "chưa cập nhật số chỗ"
            lines.append(
                f"- {car.name}: {seats}, {car.transmission or 'chưa cập nhật hộp số'}, "
                f"màu {car.color or 'chưa cập nhật'}, giá {_money(car.price_per_day)}, "
                f"trạng thái {_car_status_label(car.status)}."
            )
        if len(filtered_cars) > 6:
            lines.append(f"Còn {len(filtered_cars) - 6} xe khác, bạn có thể xem thêm trong trang Thuê xe tự lái.")
        return AiChatResponse(provider="local_fallback", reply="\n".join(lines))

    return AiChatResponse(
        provider="local_fallback",
        reply=(
            "Mình chưa kết nối được AI bên ngoài lúc này nên chỉ có thể hỗ trợ nhanh theo dữ liệu website. "
            "Bạn có thể hỏi về xe, giá thuê, số chỗ, trạng thái xe hoặc chuyển sang tab Nhân viên để được trả lời trực tiếp."
        ),
    )


@router.post("/chat", response_model=AiChatResponse)
def chat(payload: AiChatRequest, db: Session = Depends(get_db)):
    last_error = None
    system_prompt = _system_prompt(_build_website_context(db))

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            return _call_gemini(payload, gemini_key, system_prompt)
        except HTTPException as error:
            last_error = error

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            return _call_groq(payload, groq_key, system_prompt)
        except HTTPException as error:
            last_error = error

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        try:
            return _call_openrouter(payload, openrouter_key, system_prompt)
        except HTTPException as error:
            last_error = error

    if last_error:
        return _local_website_reply(payload, db)

    return AiChatResponse(
        provider="not_configured",
        reply=_local_website_reply(payload, db).reply,
    )
