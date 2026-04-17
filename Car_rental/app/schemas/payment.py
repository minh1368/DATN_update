from pydantic import BaseModel

class PaymentCreate(BaseModel):
    contract_id: int
    amount: float
    method: str

class PaymentResponse(BaseModel):
    payment_id: int
    contract_id: int
    amount: float
    method: str
    status: str

    class Config:
        from_attributes = True