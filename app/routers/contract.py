from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, require_staff_or_admin
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.rental_request import RentalRequest
from app.models.car import Car
from app.schemas.contract import ContractResponse

router = APIRouter(prefix="/contracts", tags=["Contracts"])

# GET contracts
@router.get("/", response_model=List[ContractResponse])
def get_contracts(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    return db.query(Contract).all()

# GET contract detail
@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract không tồn tại")
    return contract

# CREATE contract from request
@router.post("/{request_id}", response_model=ContractResponse)
def create_contract(request_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    if req.status != "approved":
        raise HTTPException(status_code=400, detail="Yêu cầu chưa được duyệt")

    car = db.query(Car).filter(Car.car_id == req.car_id).first()

    if not car:
        raise HTTPException(status_code=404, detail="Xe không tồn tại")

    if car.status != "available":
        raise HTTPException(status_code=400, detail="Xe đã được thuê")

    days = (req.end_date - req.start_date).days
    if days <= 0:
        raise HTTPException(status_code=400, detail="Ngày không hợp lệ")

    total_price = float(days * car.price_per_day)

    contract = Contract(
        request_id=req.request_id,
        customer_id=req.customer_id,
        car_id=req.car_id,
        start_date=req.start_date,
        end_date=req.end_date,
        total_price=total_price,
        status="pending"
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    return contract

# APPROVE contract
@router.put("/{contract_id}/approve", response_model=ContractResponse)
def approve_contract(contract_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract không tồn tại")

    if contract.status != "pending":
        raise HTTPException(status_code=400, detail="Contract đã được xử lý")

    car = db.query(Car).filter(Car.car_id == contract.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Xe không tồn tại")

    if car.status != "available":
        raise HTTPException(status_code=400, detail="Xe hiện không khả dụng")

    contract.status = "approved"
    car.status = "rented"
    db.commit()
    db.refresh(contract)

    return contract

# Trả xe
@router.put("/{contract_id}/return")
def return_car(contract_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()

    if not contract:
        raise HTTPException(404, "Contract không tồn tại")

    if contract.status != "approved":
        raise HTTPException(400, "Chỉ trả xe khi contract đã được duyệt")

    payment = db.query(Payment).filter(Payment.contract_id == contract.contract_id).first()

    if not payment or payment.status != "paid":
        raise HTTPException(400, "Chưa thanh toán")

    car = db.query(Car).filter(Car.car_id == contract.car_id).first()
    if not car:
        raise HTTPException(404, "Xe không tồn tại")

    car.status = "available"
    contract.status = "completed"

    db.commit()

    return {"message": "Trả xe thành công"}
