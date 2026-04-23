from pydantic import BaseModel
from typing import Optional

class CarCreate(BaseModel):
    name: str
    brand: str
    license_plate: str
    price_per_day: float
    status: str

        # thêm
    color: Optional[str] = None
    seats: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None

class CarResponse(CarCreate):
    car_id: int

    class Config:
        from_attributes = True