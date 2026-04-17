from pydantic import BaseModel
from datetime import date

class RentalRequestCreate(BaseModel):
    customer_id: int
    car_id: int
    start_date: date
    end_date: date

class RentalRequestResponse(RentalRequestCreate):
    request_id: int
    status: str

    class Config:
        from_attributes = True