from datetime import datetime

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    customer_id: int
    name: str
    email: str
    rating: int = 5
    message: str


class ReviewResponse(BaseModel):
    review_id: int
    customer_id: int
    name: str
    email: str
    rating: int
    message: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True
