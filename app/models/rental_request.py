from sqlalchemy import Column, Integer, ForeignKey, Date, String
from app.database import Base

class RentalRequest(Base):
    __tablename__ = "rental_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    car_id = Column(Integer, ForeignKey("cars.car_id"))
    
    start_date = Column(Date)
    end_date = Column(Date)
    
    status = Column(String, default="pending")  # pending / approved / rejected