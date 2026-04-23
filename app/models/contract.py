from sqlalchemy import Column, Integer, ForeignKey, Date, Numeric, String
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    contract_id = Column(Integer, primary_key=True, index=True)

    request_id = Column(Integer, ForeignKey("rental_requests.request_id"))
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    car_id = Column(Integer, ForeignKey("cars.car_id"))

    start_date = Column(Date)
    end_date = Column(Date)

    total_price = Column(Numeric)

    status = Column(String, default="pending")  # pending / approved / rejected