from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.dependencies import get_db, require_staff_or_admin
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.rental_request import RentalRequest
from app.models.rental_request import RentalRequest
from app.models.car import Car
from app.rental_availability import has_overlapping_booking
from app.schemas.contract import ContractResponse

router = APIRouter(prefix="/contracts", tags=["Contracts"])
VAT_RATE = 0.08


class ContractSignPayload(BaseModel):
    signer: str = "staff"

# GET contracts
@router.get("/", response_model=List[ContractResponse])
def get_contracts(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    return db.query(Contract).all()

# GET contracts by customer
@router.get("/customer/{customer_id}", response_model=List[ContractResponse])
def get_contracts_by_customer(customer_id: int, db: Session = Depends(get_db)):
    return db.query(Contract).filter(Contract.customer_id == customer_id).all()

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

    if has_overlapping_booking(db, req.car_id, req.start_date, req.end_date, exclude_request_id=req.request_id):
        raise HTTPException(status_code=400, detail="Xe đã có lịch thuê trong khoảng thời gian này")

    days = (req.end_date - req.start_date).days + 1
    if days <= 0:
        raise HTTPException(status_code=400, detail="Ngày không hợp lệ")

    rental_fee = float(days * float(car.price_per_day or 0))
    total_price = float(rental_fee + round(rental_fee * VAT_RATE))

    deposit_payment = db.query(Payment).filter(
        Payment.request_id == req.request_id,
        Payment.payment_type == "deposit",
    ).first()
    if not deposit_payment or deposit_payment.status != "paid":
        raise HTTPException(status_code=400, detail="Chưa xác nhận tiền đặt cọc")

    remaining_payment = db.query(Payment).filter(
        Payment.request_id == req.request_id,
        Payment.payment_type.in_(["remaining", "rental"]),
    ).first()
    remaining_due = max(total_price - float(deposit_payment.amount or 0), 0)
    if remaining_due > 0 and (not remaining_payment or remaining_payment.status != "paid"):
        raise HTTPException(status_code=400, detail="Chưa thanh toán đủ tiền thuê")

    contract = Contract(
        request_id=req.request_id,
        customer_id=req.customer_id,
        car_id=req.car_id,
        start_date=req.start_date,
        end_date=req.end_date,
        total_price=total_price,
        status="approved"
    )

    db.add(contract)
    db.flush()
    car.status = "rented"
    for payment in db.query(Payment).filter(Payment.request_id == req.request_id).all():
        payment.contract_id = contract.contract_id
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

    if has_overlapping_booking(
        db,
        contract.car_id,
        contract.start_date,
        contract.end_date,
        exclude_request_id=contract.request_id,
        exclude_contract_id=contract.contract_id,
    ):
        raise HTTPException(status_code=400, detail="Xe đã có lịch thuê trong khoảng thời gian này")

    contract.status = "approved"
    car.status = "rented"

    paid_deposit_amount = sum(
        float(payment.amount or 0)
        for payment in db.query(Payment).filter(
            Payment.request_id == contract.request_id,
            Payment.payment_type == "deposit",
            Payment.status == "paid",
        ).all()
    )
    remaining_amount = max(float(contract.total_price or 0) - paid_deposit_amount, 0)
    existing_payment = db.query(Payment).filter(
        Payment.request_id == contract.request_id,
        Payment.payment_type.in_(["remaining", "rental"]),
    ).first()
    if remaining_amount > 0 and (not existing_payment or existing_payment.status != "paid"):
        raise HTTPException(status_code=400, detail="Chưa thanh toán đủ tiền thuê")
    if existing_payment:
        existing_payment.contract_id = contract.contract_id
        existing_payment.request_id = contract.request_id
        existing_payment.amount = remaining_amount
        existing_payment.total_amount = contract.total_price
        existing_payment.remaining_amount = remaining_amount
        existing_payment.payment_type = existing_payment.payment_type or "remaining"
        if remaining_amount == 0:
            existing_payment.status = "paid"

    db.commit()
    db.refresh(contract)

    return contract


@router.put("/{contract_id}/issue-invoice", response_model=ContractResponse)
def issue_invoice(contract_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")

    if contract.status not in ["approved", "completed"]:
        raise HTTPException(status_code=400, detail="Chỉ phát hành hóa đơn cho hợp đồng đã duyệt hoặc đã hoàn thành")

    now = datetime.utcnow()
    if not contract.invoice_code:
        contract.invoice_code = f"HDDT-{contract.contract_id:04d}-{now.strftime('%Y%m%d%H%M%S')}"
    contract.invoice_status = "issued"
    contract.invoice_issued_at = now

    db.commit()
    db.refresh(contract)
    return contract


@router.put("/{contract_id}/sign", response_model=ContractResponse)
def sign_contract(
    contract_id: int,
    payload: ContractSignPayload,
    db: Session = Depends(get_db),
    user: dict = Depends(require_staff_or_admin),
):
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")

    signer = (payload.signer or "staff").strip().lower()
    now = datetime.utcnow()

    if signer in ["staff", "admin", "company", "nhan_su", "nhân sự"]:
        contract.staff_signed_at = contract.staff_signed_at or now
    elif signer in ["customer", "khach_hang", "khách hàng"]:
        contract.customer_signed_at = contract.customer_signed_at or now
    elif signer == "both":
        contract.staff_signed_at = contract.staff_signed_at or now
        contract.customer_signed_at = contract.customer_signed_at or now
    else:
        raise HTTPException(status_code=400, detail="Người ký không hợp lệ")

    if contract.staff_signed_at and contract.customer_signed_at:
        contract.signature_status = "completed"
    elif contract.staff_signed_at:
        contract.signature_status = "company_signed"
    elif contract.customer_signed_at:
        contract.signature_status = "customer_signed"
    else:
        contract.signature_status = "unsigned"

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

    payments = db.query(Payment).filter(Payment.contract_id == contract.contract_id).all()
    rejected_statuses = {"rejected", "cancelled", "refund_pending", "refunded"}
    if any(StringStatus(payment.status) in rejected_statuses for payment in payments):
        raise HTTPException(400, "Thanh toán đã bị từ chối, không thể trả xe")

    paid_amount = sum(
        float(payment.amount or 0)
        for payment in payments
        if StringStatus(payment.status) == "paid"
    )
    if paid_amount + 0.01 < float(contract.total_price or 0):
        raise HTTPException(400, "Chưa thanh toán đủ tiền thuê")

    car = db.query(Car).filter(Car.car_id == contract.car_id).first()
    if not car:
        raise HTTPException(404, "Xe không tồn tại")

    car.status = "available"
    contract.status = "completed"
    if contract.request_id:
        rental_request = db.query(RentalRequest).filter(RentalRequest.request_id == contract.request_id).first()
        if rental_request:
            rental_request.status = "completed"

    db.commit()

    return {"message": "Trả xe thành công"}


def StringStatus(value: str | None) -> str:
    return str(value or "").strip().lower()
