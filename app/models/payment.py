from sqlalchemy import Column, DateTime, Integer, ForeignKey, Numeric, String
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)

    contract_id = Column(Integer, ForeignKey("contracts.contract_id"), nullable=True)
    request_id = Column(Integer, ForeignKey("rental_requests.request_id"), nullable=True)
    
    amount = Column(Numeric)
    total_amount = Column(Numeric, nullable=True)
    remaining_amount = Column(Numeric, nullable=True)
    payment_type = Column(String, default="rental")  # deposit / remaining / rental / refund
    status = Column(String, default="unpaid")  # pending / unpaid / paid / refund_pending / refunded / rejected / cancelled
    note = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
