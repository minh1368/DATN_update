import os
import random
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, require_admin, require_staff_or_admin
from app.models.user import User
from app.schemas.user import (
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetVerify,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.security import create_access_token, hash_password, is_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["Users"])


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_internal_role(role: str) -> str:
    normalized = (role or "").strip().lower()
    if normalized not in {"admin", "staff"}:
        raise HTTPException(status_code=400, detail="Vai trò chỉ được là admin hoặc staff")
    return normalized


def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def send_reset_otp_email(to_email: str, otp: str) -> None:
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@example.com").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes")

    message = EmailMessage()
    message["Subject"] = "Yêu cầu đặt lại mật khẩu"
    message["From"] = smtp_from
    message["To"] = to_email
    message.set_content(
        f"Mã OTP đặt lại mật khẩu của bạn là: {otp}\n\nMã có hiệu lực trong 10 phút."
    )

    if not smtp_host:
        raise RuntimeError("SMTP_HOST chưa được cấu hình. Vui lòng thiết lập biến môi trường SMTP.")

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                if use_tls:
                    server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.send_message(message)
    except Exception as exc:
        raise RuntimeError(f"Không gửi được email OTP: {exc}") from exc


def user_response(user: User, include_token: bool = False) -> UserResponse:
    token = create_access_token({
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role,
    }) if include_token else None
    return UserResponse(
        user_id=user.user_id,
        name=user.name,
        email=user.email,
        role=user.role,
        password="",
        created_at=user.created_at,
        token=token,
    )


def ensure_unique_email(db: Session, email: str):
    if db.query(User).filter(User.email.ilike(email)).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")


def ensure_unique_email_for_update(db: Session, email: str, user_id: int):
    existing = db.query(User).filter(User.email.ilike(email), User.user_id != user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")


@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    users = db.query(User).filter(User.role != "customer").order_by(User.user_id).all()
    return [user_response(account) for account in users]


@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    data = user.model_dump()
    if len(data.get("password") or "") < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự")
    data["email"] = normalize_email(data["email"])
    data["name"] = (data.get("name") or "").strip() or None
    data["role"] = validate_internal_role(data.get("role"))
    data["password"] = (
        hash_password(data["password"])
        if data.get("password") and not is_password_hash(data["password"])
        else data.get("password", "")
    )
    ensure_unique_email(db, data["email"])
    new_user = User(**data)
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    return user_response(new_user)





@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    existing_user = db.query(User).filter(User.user_id == user_id).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    email = normalize_email(user.email)
    ensure_unique_email_for_update(db, email, user_id)
    next_role = validate_internal_role(user.role)
    if existing_user.role == "admin" and next_role != "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Không thể hạ quyền quản trị viên cuối cùng")

    existing_user.name = (user.name or "").strip() or None
    existing_user.email = email
    if user.password:
        if len(user.password) < 6:
            raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự")
        existing_user.password = hash_password(user.password) if not is_password_hash(user.password) else user.password
    existing_user.role = next_role

    try:
        db.commit()
        db.refresh(existing_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    return user_response(existing_user)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    existing_user = db.query(User).filter(User.user_id == user_id).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    if existing_user.user_id == admin.get("user_id"):
        raise HTTPException(status_code=400, detail="Không thể tự xóa tài khoản đang đăng nhập")
    if existing_user.role == "admin" and db.query(User).filter(User.role == "admin").count() <= 1:
        raise HTTPException(status_code=400, detail="Không thể xóa quản trị viên cuối cùng")

    db.delete(existing_user)
    db.commit()
    return {"message": "Xóa thành công"}


@router.post("/login", response_model=UserResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    email = normalize_email(credentials.email)
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Tài khoản hoặc mật khẩu sai")

    if not is_password_hash(user.password):
        user.password = hash_password(credentials.password)
        db.commit()
        db.refresh(user)

    return user_response(user, include_token=True)


@router.post("/reset-password/request")
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    email = normalize_email(payload.email)
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email chưa được đăng ký trong hệ thống")

    otp = generate_otp()
    expires_at = datetime.now() + timedelta(minutes=10)
    if user:
        user.reset_otp = otp
        user.reset_otp_expires_at = expires_at
        db.commit()
        try:
            send_reset_otp_email(user.email, otp)
        except RuntimeError as exc:
            user.reset_otp = None
            user.reset_otp_expires_at = None
            db.commit()
            raise HTTPException(status_code=500, detail=f"Lỗi gửi email OTP: {exc}")

    return {"message": "Mã OTP đã được gửi, hãy kiểm tra email."}


@router.post("/reset-password/verify")
def verify_password_reset(payload: PasswordResetVerify, db: Session = Depends(get_db)):
    email = normalize_email(payload.email)
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not user.reset_otp or not user.reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="Mã OTP không hợp lệ hoặc đã hết hạn.")
    if datetime.now() > user.reset_otp_expires_at:
        user.reset_otp = None
        user.reset_otp_expires_at = None
        db.commit()
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn. Vui lòng yêu cầu lại.")
    if payload.otp.strip() != user.reset_otp:
        raise HTTPException(status_code=400, detail="Mã OTP không đúng.")

    return {"message": "Mã OTP hợp lệ."}


@router.post("/reset-password/confirm")
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    email = normalize_email(payload.email)
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not user.reset_otp or not user.reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.")
    if datetime.now() > user.reset_otp_expires_at:
        user.reset_otp = None
        user.reset_otp_expires_at = None
        db.commit()
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn. Vui lòng yêu cầu lại.")
    if payload.otp.strip() != user.reset_otp:
        raise HTTPException(status_code=400, detail="Mã OTP không đúng.")
    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự.")

    user.password = hash_password(payload.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()
    return {"message": "Mật khẩu đã được đặt lại thành công."}
