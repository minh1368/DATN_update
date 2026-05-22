from pydantic import BaseModel


class ConversationCreate(BaseModel):
    customer_id: int | None = None
    customer_name: str
    customer_email: str | None = None


class MessageCreate(BaseModel):
    message: str


class ConversationResponse(BaseModel):
    conversation_id: int
    customer_id: int | None = None
    customer_name: str
    customer_email: str | None = None
    status: str | None = None
    latest_message: str | None = None
    latest_sender: str | None = None
    updated_at: str | None = None


class MessageResponse(BaseModel):
    message_id: int
    conversation_id: int
    sender: str
    message: str
    created_at: str | None = None
