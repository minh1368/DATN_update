from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

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
    status: str
    invoice_code: Optional[str] = None
    invoice_status: Optional[str] = None
    invoice_issued_at: Optional[datetime] = None
    customer_signed_at: Optional[datetime] = None
    staff_signed_at: Optional[datetime] = None
    signature_status: Optional[str] = None

    class Config:
        from_attributes = True
