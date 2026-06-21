from sqlalchemy import Column, DateTime, Integer, String, func
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    password = Column(String)
    reset_otp = Column(String, nullable=True)
    reset_otp_expires_at = Column(DateTime, nullable=True)
    address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
