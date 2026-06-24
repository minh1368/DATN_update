from sqlalchemy import Column, Integer, ForeignKey, Date, String
from app.database import Base

class RentalRequest(Base):
    __tablename__ = "rental_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    car_id = Column(Integer, ForeignKey("cars.car_id"), nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    pickup_location = Column(String)
    
    status = Column(String, nullable=False, default="pending")
