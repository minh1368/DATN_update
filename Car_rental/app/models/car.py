from sqlalchemy import Column, Integer, String, Numeric
from app.database import Base

class Car(Base):
    __tablename__ = "cars"

    car_id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    brand = Column(String)
    license_plate = Column(String)
    price_per_day = Column(Numeric)
    status = Column(String)