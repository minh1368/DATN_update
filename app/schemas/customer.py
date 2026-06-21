from pydantic import BaseModel
from datetime import datetime

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    password: str | None = None
    address: str | None = None

class CustomerResponse(BaseModel):
    customer_id: int
    name: str
    phone: str
    email: str | None = None
    address: str | None = None
    created_at: datetime | None = None
    token: str | None = None

    class Config:
        from_attributes = True
