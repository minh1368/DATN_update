from sqlalchemy import Column, Integer, ForeignKey, Date, Numeric, String
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    contract_id = Column(Integer, primary_key=True, index=True)

    request_id = Column(Integer, ForeignKey("rental_requests.request_id"), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    car_id = Column(Integer, ForeignKey("cars.car_id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    total_price = Column(Numeric, nullable=False)

    status = Column(String, nullable=False, default="pending")
