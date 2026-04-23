from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.rental_request import RentalRequest
from app.models.car import Car
from app.schemas.contract import ContractResponse

router = APIRouter(prefix="/contracts", tags=["Contracts"])

# GET contracts
@router.get("/", response_model=List[ContractResponse])
def get_contracts(db: Session = Depends(get_db)):
    return db.query(Contract).all()

# CREATE contract from request
@router.post("/{request_id}", response_model=ContractResponse)
def create_contract(request_id: int, db: Session = Depends(get_db)):
    
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    if req.status != "approved":
        raise HTTPException(status_code=400, detail="Yêu cầu chưa được duyệt")

    # lấy thông tin xe
    car = db.query(Car).filter(Car.car_id == req.car_id).first()

    if not car:
        raise HTTPException(status_code=404, detail="Xe không tồn tại")

    if car.status != "available":
        raise HTTPException(status_code=400, detail="Xe đã được thuê")

    # tính số ngày thuê
    days = (req.end_date - req.start_date).days
    if days <= 0:
        raise HTTPException(status_code=400, detail="Ngày không hợp lệ")

    # tinh tổng tiền
    total_price = days * car.price_per_day

    #tạo hợp đồng
    contract = Contract(
        request_id=req.request_id,
        customer_id=req.customer_id,
        car_id=req.car_id,
        start_date=req.start_date,
        end_date=req.end_date,
        total_price=total_price
    )

    db.add(contract)
    try:
        db.add(contract)

        # Update trạng thái xe
        car.status = "rented"

        db.commit()
        db.refresh(contract)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
# Trả xe
@router.put("/{contract_id}/return")
def return_car(contract_id: int, db: Session = Depends(get_db)):

    contract = db.query(Contract).filter(
        Contract.contract_id == contract_id
    ).first()

    if not contract:
        raise HTTPException(404, "Contract không tồn tại")

    if contract.status != "approved":
        raise HTTPException(400, "Chỉ trả xe khi contract đã được duyệt")

    # kiểm tra đã thanh toán chưa
    payment = db.query(Payment).filter(
        Payment.contract_id == contract.contract_id
    ).first()

    if not payment or payment.status != "paid":
        raise HTTPException(400, "Chưa thanh toán")

    car = db.query(Car).filter(Car.car_id == contract.car_id).first()

    car.status = "available"
    contract.status = "completed"

    db.commit()

    return {"message": "Trả xe thành công"}
