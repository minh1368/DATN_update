from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class SupportConversation(Base):
    __tablename__ = "support_conversations"

    conversation_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String)
    status = Column(String, default="open")
    customer_last_read_message_id = Column(Integer, default=0)
    staff_last_read_message_id = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SupportMessage(Base):
    __tablename__ = "support_messages"

    message_id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("support_conversations.conversation_id"), nullable=False)
    sender = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
