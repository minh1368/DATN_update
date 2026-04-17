from sqlalchemy import Column, Integer, ForeignKey, Numeric, String
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)

    contract_id = Column(Integer, ForeignKey("contracts.contract_id"))
    
    amount = Column(Numeric)
    method = Column(String)  # cash / transfer
    status = Column(String, default="unpaid")  # unpaid / paid