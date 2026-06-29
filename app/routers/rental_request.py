from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.dependencies import get_db, require_admin, require_staff_or_admin
from app.models.rental_request import RentalRequest
from app.models.car import Car
from app.models.payment import Payment
from app.models.contract import Contract
from app.rental_availability import has_overlapping_booking, has_overlapping_customer_booking
from app.schemas.rental_request import RentalRequestCreate, RentalRequestResponse

router = APIRouter(prefix="/rental_requests", tags=["Rental Requests"])

DEPOSIT_RATE = 0.2
MIN_DEPOSIT_AMOUNT = 300_000
VAT_RATE = 0.08


class RejectRequestPayload(BaseModel):
    reason: str | None = None


def calculate_rental_total(car: Car, req: RentalRequestCreate) -> float:
    days = (req.end_date - req.start_date).days + 1
    rental_fee = float(days * float(car.price_per_day or 0))
    return float(rental_fee + round(rental_fee * VAT_RATE))


def calculate_deposit_amount(total_amount: float) -> float:
    if total_amount <= 0:
        return 0
    return float(min(total_amount, max(MIN_DEPOSIT_AMOUNT, round(total_amount * DEPOSIT_RATE))))


def create_deposit_payment(db: Session, rental_request: RentalRequest, total_amount: float) -> None:
    existing = db.query(Payment).filter(
        Payment.request_id == rental_request.request_id,
        Payment.payment_type == "deposit",
    ).first()
    if existing:
        return

    deposit_amount = calculate_deposit_amount(total_amount)
    db.add(Payment(
        request_id=rental_request.request_id,
        amount=deposit_amount,
        total_amount=total_amount,
        remaining_amount=max(total_amount - deposit_amount, 0),
        payment_type="deposit",
        status="unpaid",
        note=f"Đặt cọc yêu cầu #{rental_request.request_id}",
    ))

def create_remaining_payment(db: Session, rental_request: RentalRequest, deposit: Payment | None) -> None:
    existing = db.query(Payment).filter(
        Payment.request_id == rental_request.request_id,
        Payment.payment_type == "remaining",
    ).first()
    if existing:
        return

    total_amount = float(deposit.total_amount or 0) if deposit else 0
    deposit_amount = float(deposit.amount or 0) if deposit else 0
    remaining_amount = max(total_amount - deposit_amount, 0)
    db.add(Payment(
        request_id=rental_request.request_id,
        amount=remaining_amount,
        total_amount=total_amount,
        remaining_amount=remaining_amount,
        payment_type="remaining",
        status="paid" if remaining_amount == 0 else "unpaid",
        note=f"Thanh toán phần còn lại khi nhận xe cho yêu cầu #{rental_request.request_id}",
    ))


# GET all requests
@router.get("/", response_model=List[RentalRequestResponse])
def get_requests(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    return db.query(RentalRequest).all()

# GET requests by customer
@router.get("/customer/{customer_id}", response_model=List[RentalRequestResponse])
def get_requests_by_customer(customer_id: int, db: Session = Depends(get_db)):
    return db.query(RentalRequest).filter(RentalRequest.customer_id == customer_id).all()


@router.get("/customer-details/{customer_id}")
def get_request_details_by_customer(customer_id: int, db: Session = Depends(get_db)):
    customer_requests = db.query(RentalRequest).filter(RentalRequest.customer_id == customer_id).all()
    results = []
    for item in customer_requests:
        car = db.query(Car).filter(Car.car_id == item.car_id).first()
        deposit = db.query(Payment).filter(
            Payment.request_id == item.request_id,
            Payment.payment_type == "deposit",
        ).first()
        remaining = db.query(Payment).filter(
            Payment.request_id == item.request_id,
            Payment.payment_type == "remaining",
        ).first()
        contract = db.query(Contract).filter(Contract.request_id == item.request_id).first()
        reject_reason = ""
        reject_payment = next(
            (
                payment
                for payment in (deposit, remaining)
                if payment and payment.status == "rejected" and payment.note
            ),
            None,
        )
        if item.status == "rejected" or reject_payment:
            if reject_payment:
                reject_reason = reject_payment.note
                prefix = "Lý do từ chối:"
                if reject_reason.startswith(prefix):
                    reject_reason = reject_reason[len(prefix):].strip()
        results.append({
            "request_id": item.request_id,
            "customer_id": item.customer_id,
            "car_id": item.car_id,
            "car_name": car.name if car else "",
            "start_date": item.start_date,
            "end_date": item.end_date,
            "pickup_location": item.pickup_location,
            "status": item.status,
            "contract_id": contract.contract_id if contract else None,
            "contract_status": contract.status if contract else None,
            "reject_reason": reject_reason,
            "payments": {
                "deposit": {
                    "payment_id": deposit.payment_id,
                    "status": deposit.status,
                    "note": deposit.note,
                } if deposit else None,
                "remaining": {
                    "payment_id": remaining.payment_id,
                    "status": remaining.status,
                    "note": remaining.note,
                } if remaining else None,
            },
        })
    return results

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

    if has_overlapping_customer_booking(db, req.customer_id, req.start_date, req.end_date):
        raise HTTPException(status_code=400, detail="Khách hàng đã có lịch thuê xe trong khoảng thời gian này")

    total_amount = calculate_rental_total(car, req)
    new_req = RentalRequest(**req.model_dump(), status="pending")
    db.add(new_req)
    db.flush()
    create_deposit_payment(db, new_req, total_amount)
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

    if has_overlapping_customer_booking(db, req.customer_id, req.start_date, req.end_date):
        raise HTTPException(
            status_code=400,
            detail="Bạn đã có lịch thuê xe trong khoảng thời gian này. Vui lòng chọn thời gian khác.",
        )

    if has_overlapping_booking(db, req.car_id, req.start_date, req.end_date):
        raise HTTPException(status_code=400, detail="Xe đã có lịch thuê trong khoảng thời gian này")

    total_amount = calculate_rental_total(car, req)
    new_req = RentalRequest(**req.model_dump(), status="pending")
    db.add(new_req)
    db.flush()
    create_deposit_payment(db, new_req, total_amount)
    db.commit()
    db.refresh(new_req)
    return new_req

# PUT approve request
@router.put("/{request_id}/approve")
def approve_request(request_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    deposit = db.query(Payment).filter(
        Payment.request_id == req.request_id,
        Payment.payment_type == "deposit",
    ).first()
    if deposit:
        deposit.status = "paid"
        deposit.paid_at = datetime.utcnow()
    req.status = "approved"
    create_remaining_payment(db, req, deposit)
    db.commit()
    
    return {"message": "Đã duyệt yêu cầu"}

# DELETE request
@router.delete("/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db), user: dict = Depends(require_admin)):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    related_contract = db.query(Contract).filter(Contract.request_id == request_id).first()
    if related_contract:
        raise HTTPException(status_code=400, detail="Không thể xóa yêu cầu đã tạo hợp đồng")

    db.query(Payment).filter(Payment.request_id == request_id).delete()
    db.delete(req)
    db.commit()

    return {"message": "Đã xóa yêu cầu"}

# PUT reject request
@router.put("/{request_id}/reject")
def reject_request(
    request_id: int,
    payload: RejectRequestPayload | None = None,
    db: Session = Depends(get_db),
    user: dict = Depends(require_staff_or_admin),
):
    req = db.query(RentalRequest).filter(RentalRequest.request_id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

    req.status = "rejected"
    reason = (payload.reason or "").strip() if payload else ""
    reject_note = f"Lý do từ chối: {reason}" if reason else "Yêu cầu bị từ chối"
    deposit = db.query(Payment).filter(
        Payment.request_id == req.request_id,
        Payment.payment_type == "deposit",
    ).first()
    if deposit:
        deposit.status = "rejected"
        deposit.note = reject_note
    else:
        # Yêu cầu bị từ chối khi chưa có giao dịch đặt cọc (còn pending)
        # Tạo một bản ghi payment để lưu lý do từ chối
        rejected_payment = Payment(
            request_id=req.request_id,
            amount=0,
            total_amount=0,
            remaining_amount=0,
            payment_type="deposit",
            status="rejected",
            note=reject_note,
        )
        db.add(rejected_payment)
    db.commit()
    
    return {"message": "Đã từ chối yêu cầu"}
