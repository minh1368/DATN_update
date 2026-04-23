from pydantic import BaseModel
from datetime import date

class ContractCreate(BaseModel):
    request_id: int

class ContractResponse(BaseModel):
    contract_id: int
    request_id: int
    customer_id: int
    car_id: int
    start_date: date
    end_date: date
    total_price: float

    class Config:
        from_attributes = True