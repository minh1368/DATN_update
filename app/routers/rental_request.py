from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db
from app.models.rental_request import RentalRequest
from app.schemas.rental_request import RentalRequestCreate, RentalRequestResponse

router = APIRouter(prefix="/rental_requests", tags=["Rental Requests"])

# GET all requests
@router.get("/", response_model=List[RentalRequestResponse])
def get_requests(db: Session = Depends(get_db)):
    return db.query(RentalRequest).all()

# POST create request
@router.post("/", response_model=RentalRequestResponse)
def create_request(req: RentalRequestCreate, db: Session = Depends(get_db)):
    new_req = RentalRequest(**req.dict())
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

# PUT approve request
@router.put("/{request_id}/approve")
def approve_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    req.status = "approved"
    db.commit()
    
    return {"message": "Đã duyệt yêu cầu"}

# PUT reject request
@router.put("/{request_id}/reject")
def reject_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    req.status = "rejected"
    db.commit()
    
    return {"message": "Đã từ chối yêu cầu"}