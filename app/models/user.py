from sqlalchemy import Column, DateTime, Integer, String, func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    reset_otp = Column(String, nullable=True)
    reset_otp_expires_at = Column(DateTime, nullable=True)
    role = Column(String, nullable=False)  # admin / staff
    created_at = Column(DateTime(timezone=True), server_default=func.now())
