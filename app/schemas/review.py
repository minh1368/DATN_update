from datetime import datetime

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    customer_id: int | None = None
    name: str
    email: str | None = None
    rating: int = 5
    message: str


class ReviewResponse(BaseModel):
    review_id: int
    customer_id: int | None = None
    name: str
    email: str | None = None
    rating: int
    message: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True
