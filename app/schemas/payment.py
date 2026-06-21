from pydantic import BaseModel
from datetime import datetime

class PaymentCreate(BaseModel):
    contract_id: int

class PaymentRejectPayload(BaseModel):
    reason: str | None = None

class PaymentResponse(BaseModel):
    payment_id: int
    contract_id: int | None = None
    request_id: int | None = None
    amount: float
    total_amount: float | None = None
    remaining_amount: float | None = None
    payment_type: str | None = None
    status: str
    note: str | None = None
    paid_at: datetime | None = None

    class Config:
        from_attributes = True

