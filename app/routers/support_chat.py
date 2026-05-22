from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_staff_or_admin
from app.models.support_chat import SupportConversation, SupportMessage
from app.schemas.support_chat import ConversationCreate, MessageCreate

router = APIRouter(prefix="/support", tags=["Support Chat"])


def _conversation_to_dict(conversation: SupportConversation, latest: SupportMessage | None = None):
    customer_unread_count = db_count_customer_unread(conversation) if latest else 0
    staff_unread_count = db_count_staff_unread(conversation) if latest else 0
    return {
        "conversation_id": conversation.conversation_id,
        "customer_id": conversation.customer_id,
        "customer_name": conversation.customer_name,
        "customer_email": conversation.customer_email,
        "status": conversation.status,
        "latest_message": latest.message if latest else None,
        "latest_sender": latest.sender if latest else None,
        "customer_unread_count": customer_unread_count,
        "staff_unread_count": staff_unread_count,
        "updated_at": conversation.updated_at.isoformat() if conversation.updated_at else None,
    }


def db_count_staff_unread(conversation: SupportConversation) -> int:
    return getattr(conversation, "_staff_unread_count", 0)


def db_count_customer_unread(conversation: SupportConversation) -> int:
    return getattr(conversation, "_customer_unread_count", 0)


def _attach_unread_counts(db: Session, conversation: SupportConversation) -> SupportConversation:
    customer_last_read = conversation.customer_last_read_message_id or 0
    staff_last_read = conversation.staff_last_read_message_id or 0
    conversation._customer_unread_count = (
        db.query(SupportMessage)
        .filter(
            SupportMessage.conversation_id == conversation.conversation_id,
            SupportMessage.sender == "staff",
            SupportMessage.message_id > customer_last_read,
        )
        .count()
    )
    conversation._staff_unread_count = (
        db.query(SupportMessage)
        .filter(
            SupportMessage.conversation_id == conversation.conversation_id,
            SupportMessage.sender == "customer",
            SupportMessage.message_id > staff_last_read,
        )
        .count()
    )
    return conversation


def _mark_read(db: Session, conversation: SupportConversation, reader: str) -> None:
    latest = (
        db.query(SupportMessage)
        .filter(SupportMessage.conversation_id == conversation.conversation_id)
        .order_by(SupportMessage.message_id.desc())
        .first()
    )
    latest_id = latest.message_id if latest else 0
    if reader == "staff":
        conversation.staff_last_read_message_id = latest_id
    if reader == "customer":
        conversation.customer_last_read_message_id = latest_id
    db.commit()


def _message_to_dict(message: SupportMessage):
    return {
        "message_id": message.message_id,
        "conversation_id": message.conversation_id,
        "sender": message.sender,
        "message": message.message,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def _get_conversation(db: Session, conversation_id: int) -> SupportConversation:
    conversation = (
        db.query(SupportConversation)
        .filter(SupportConversation.conversation_id == conversation_id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.post("/conversations")
def create_or_get_conversation(payload: ConversationCreate, db: Session = Depends(get_db)):
    email = payload.customer_email.strip().lower() if payload.customer_email else None
    query = db.query(SupportConversation).filter(SupportConversation.status == "open")
    conversation = None

    if payload.customer_id:
        conversation = query.filter(SupportConversation.customer_id == payload.customer_id).first()
    if not conversation and email:
        conversation = query.filter(SupportConversation.customer_email.ilike(email)).first()

    if not conversation:
        conversation = SupportConversation(
            customer_id=payload.customer_id,
            customer_name=payload.customer_name.strip() or "Khách hàng",
            customer_email=email,
            status="open",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    elif payload.customer_name and payload.customer_name.strip() and conversation.customer_name == "Khách hàng":
        conversation.customer_name = payload.customer_name.strip()
        db.commit()
        db.refresh(conversation)

    latest = (
        db.query(SupportMessage)
        .filter(SupportMessage.conversation_id == conversation.conversation_id)
        .order_by(SupportMessage.message_id.desc())
        .first()
    )
    return _conversation_to_dict(_attach_unread_counts(db, conversation), latest)


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    user: dict = Depends(require_staff_or_admin),
):
    conversations = db.query(SupportConversation).order_by(SupportConversation.updated_at.desc()).all()
    result = []
    for conversation in conversations:
        latest = (
            db.query(SupportMessage)
            .filter(SupportMessage.conversation_id == conversation.conversation_id)
            .order_by(SupportMessage.message_id.desc())
            .first()
        )
        result.append(_conversation_to_dict(_attach_unread_counts(db, conversation), latest))
    return result


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = _get_conversation(db, conversation_id)
    latest = (
        db.query(SupportMessage)
        .filter(SupportMessage.conversation_id == conversation_id)
        .order_by(SupportMessage.message_id.desc())
        .first()
    )
    return _conversation_to_dict(_attach_unread_counts(db, conversation), latest)


@router.get("/conversations/{conversation_id}/messages")
def list_messages(conversation_id: int, db: Session = Depends(get_db)):
    _get_conversation(db, conversation_id)
    messages = (
        db.query(SupportMessage)
        .filter(SupportMessage.conversation_id == conversation_id)
        .order_by(SupportMessage.message_id.asc())
        .all()
    )
    return [_message_to_dict(message) for message in messages]


@router.post("/conversations/{conversation_id}/read/{reader}")
def mark_conversation_read(conversation_id: int, reader: str, db: Session = Depends(get_db)):
    if reader not in {"customer", "staff"}:
        raise HTTPException(status_code=400, detail="Invalid reader")
    conversation = _get_conversation(db, conversation_id)
    _mark_read(db, conversation, reader)
    latest = (
        db.query(SupportMessage)
        .filter(SupportMessage.conversation_id == conversation_id)
        .order_by(SupportMessage.message_id.desc())
        .first()
    )
    return _conversation_to_dict(_attach_unread_counts(db, conversation), latest)


@router.post("/conversations/{conversation_id}/customer-message")
def create_customer_message(conversation_id: int, payload: MessageCreate, db: Session = Depends(get_db)):
    conversation = _get_conversation(db, conversation_id)
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message is required")

    message = SupportMessage(conversation_id=conversation_id, sender="customer", message=text)
    db.add(message)
    conversation.status = "open"
    db.commit()
    db.refresh(message)
    return _message_to_dict(message)


@router.post("/conversations/{conversation_id}/staff-message")
def create_staff_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_staff_or_admin),
):
    _get_conversation(db, conversation_id)
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message is required")

    message = SupportMessage(conversation_id=conversation_id, sender="staff", message=text)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_to_dict(message)
