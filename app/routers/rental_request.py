from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, require_staff_or_admin
from app.models.rental_request import RentalRequest
from app.models.car import Car
from app.rental_availability import has_overlapping_booking
from app.schemas.rental_request import RentalRequestCreate, RentalRequestResponse

router = APIRouter(prefix="/rental_requests", tags=["Rental Requests"])

# GET all requests
@router.get("/", response_model=List[RentalRequestResponse])
def get_requests(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    return db.query(RentalRequest).all()

# GET requests by customer
@router.get("/customer/{customer_id}", response_model=List[RentalRequestResponse])
def get_requests_by_customer(customer_id: int, db: Session = Depends(get_db)):
    return db.query(RentalRequest).filter(RentalRequest.customer_id == customer_id).all()

# POST create request (admin/staff)
@router.post("/", response_model=RentalRequestResponse)
def create_request(req: RentalRequestCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    car = db.query(Car).filter(Car.car_id == req.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Xe không tồn tại")

    if car.status != "available":
        raise HTTPException(status_code=400, detail="Xe hiện không khả dụng")

    if req.start_date > req.end_date:
        raise HTTPException(status_code=400, detail="Ngày kết thúc không được trước ngày bắt đầu")

    if has_overlapping_booking(db, req.car_id, req.start_date, req.end_date):
        raise HTTPException(status_code=400, detail="Xe đã có lịch thuê trong khoảng thời gian này")

    new_req = RentalRequest(**req.model_dump())
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

# POST create request (customer)
@router.post("/customer", response_model=RentalRequestResponse)
def create_customer_request(req: RentalRequestCreate, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.car_id == req.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Xe không tồn tại")

    if car.status != "available":
        raise HTTPException(status_code=400, detail="Xe hiện không khả dụng")

    if req.start_date > req.end_date:
        raise HTTPException(status_code=400, detail="Ngày kết thúc không được trước ngày bắt đầu")

    if has_overlapping_booking(db, req.car_id, req.start_date, req.end_date):
        raise HTTPException(status_code=400, detail="Xe đã có lịch thuê trong khoảng thời gian này")

    new_req = RentalRequest(**req.model_dump())
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

# PUT approve request
@router.put("/{request_id}/approve")
def approve_request(request_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    req.status = "approved"
    db.commit()
    
    return {"message": "Đã duyệt yêu cầu"}

# PUT reject request
@router.put("/{request_id}/reject")
def reject_request(request_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    req.status = "rejected"
    db.commit()
    
    return {"message": "Đã từ chối yêu cầu"}
