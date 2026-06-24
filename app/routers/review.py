from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.customer import Customer
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/", response_model=list[ReviewResponse])
def get_reviews(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return db.query(Review).order_by(Review.created_at.desc(), Review.review_id.desc()).limit(limit).all()


@router.post("/", response_model=ReviewResponse)
def create_review(review_data: ReviewCreate, db: Session = Depends(get_db)):
    message = review_data.message.strip()
    name = review_data.name.strip()
    email = review_data.email.strip().lower() if review_data.email else None
    rating = int(review_data.rating or 5)

    if not name:
        raise HTTPException(status_code=400, detail="Vui lòng nhập tên người đánh giá")
    if not message:
        raise HTTPException(status_code=400, detail="Vui lòng nhập nội dung đánh giá")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Số sao đánh giá phải từ 1 đến 5")

    customer = db.query(Customer).filter(Customer.customer_id == review_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=400, detail="Khách hàng không tồn tại hoặc chưa đăng nhập")
    name = customer.name or name
    email = customer.email or email
    if not email:
        raise HTTPException(status_code=400, detail="Email người đánh giá không được để trống")

    review = Review(
        customer_id=customer.customer_id,
        name=name,
        email=email,
        rating=rating,
        message=message,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
