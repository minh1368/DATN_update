from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.dependencies import get_db, require_admin, require_staff_or_admin
from app.models.payment import Payment
from app.models.contract import Contract
from app.models.rental_request import RentalRequest
from app.schemas.payment import PaymentCreate, PaymentRejectPayload, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    return db.query(Payment).all()


@router.post("/", response_model=PaymentResponse)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    contract = db.query(Contract).filter(Contract.contract_id == data.contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract không tồn tại")

    if contract.status != "approved":
        raise HTTPException(status_code=400, detail="Contract chưa được duyệt")

    existing = db.query(Payment).filter(
        Payment.request_id == contract.request_id,
        Payment.payment_type == "remaining",
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Đã tồn tại payment")

    payment = Payment(
        contract_id=data.contract_id,
        request_id=contract.request_id,
        amount=contract.total_price,
        total_amount=contract.total_price,
        remaining_amount=contract.total_price,
        payment_type="remaining",
        status="unpaid",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


@router.put("/{payment_id}/pay")
def pay(payment_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()

    if not payment:
        raise HTTPException(404, "Payment không tồn tại")

    if payment.status == "paid":
        raise HTTPException(400, "Đã thanh toán")
    if payment.status == "rejected":
        raise HTTPException(400, "Khoản thanh toán đã bị từ chối")

    payment.status = "paid"
    payment.paid_at = datetime.utcnow()

    db.commit()

    return {"message": "Thanh toán thành công"}


@router.put("/{payment_id}/reject")
def reject_payment(
    payment_id: int,
    payload: PaymentRejectPayload | None = None,
    db: Session = Depends(get_db),
    user: dict = Depends(require_staff_or_admin),
):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()

    if not payment:
        raise HTTPException(404, "Payment không tồn tại")

    if payment.status == "paid":
        raise HTTPException(400, "Khoản này đã được xử lý")

    reason = (payload.reason or "").strip() if payload else ""
    payment.status = "rejected"
    payment.note = reason or "Chưa nhận được tiền"
    if payment.request_id:
        rental_request = db.query(RentalRequest).filter(RentalRequest.request_id == payment.request_id).first()
        if rental_request and rental_request.status != "rejected":
            rental_request.status = "rejected"

    db.commit()

    return {"message": "Đã đánh dấu chưa nhận được tiền"}


@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db), user: dict = Depends(require_admin)):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()

    if not payment:
        raise HTTPException(404, "Payment khong ton tai")

    db.delete(payment)
    db.commit()

    return {"message": "Xoa thanh toan thanh cong"}
