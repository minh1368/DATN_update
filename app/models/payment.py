from sqlalchemy import Column, DateTime, Integer, ForeignKey, Numeric, String
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)

    contract_id = Column(Integer, ForeignKey("contracts.contract_id"), nullable=True)
    request_id = Column(Integer, ForeignKey("rental_requests.request_id"), nullable=False)
    
    amount = Column(Numeric, nullable=False)
    total_amount = Column(Numeric, nullable=True)
    remaining_amount = Column(Numeric, nullable=True)
    payment_type = Column(String, nullable=False)  # deposit / remaining
    status = Column(String, nullable=False, default="unpaid")  # unpaid / paid / rejected
    note = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
