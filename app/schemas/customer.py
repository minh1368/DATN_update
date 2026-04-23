from pydantic import BaseModel

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    address: str | None = None

class CustomerResponse(CustomerCreate):
    customer_id: int

    class Config:
        from_attributes = True