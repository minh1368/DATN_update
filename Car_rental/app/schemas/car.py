from pydantic import BaseModel

class CarCreate(BaseModel):
    name: str
    brand: str
    license_plate: str
    price_per_day: float
    status: str

class CarResponse(CarCreate):
    car_id: int

    class Config:
        from_attributes = True