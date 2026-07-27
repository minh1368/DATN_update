from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from sqlalchemy import or_
from app.dependencies import get_db, require_admin, require_staff_or_admin
from app.models.payment import Payment
from app.models.rental_request import RentalRequest
from app.schemas.payment import PaymentRejectPayload, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    reviewed_rejected_request_ids = db.query(Payment.request_id).filter(
        Payment.status == "rejected",
        Payment.note.isnot(None),
        ~Payment.note.like("Lý do từ chối:%"),
    )
    return (
        db.query(Payment)
        .join(RentalRequest, RentalRequest.request_id == Payment.request_id)
        .filter(or_(
            RentalRequest.status == "approved",
            RentalRequest.request_id.in_(reviewed_rejected_request_ids),
        ))
        .all()
    )


@router.put("/{payment_id}/pay")
def pay(payment_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()

    if not payment:
        raise HTTPException(404, "Payment không tồn tại")

    if payment.status == "paid":
        raise HTTPException(400, "Đã thanh toán")
    if payment.status == "rejected":
        raise HTTPException(400, "Khoản thanh toán đã bị từ chối")
    if payment.payment_type == "remaining":
        deposit = db.query(Payment).filter(
            Payment.request_id == payment.request_id,
            Payment.payment_type == "deposit",
        ).first()
        if not deposit or deposit.status != "paid":
            raise HTTPException(400, "Chưa xác nhận tiền đặt cọc")

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

    if payment.contract_id or payment.status == "paid":
        raise HTTPException(400, "Không thể xóa khoản thanh toán đã ghi nhận vào hợp đồng")

    db.delete(payment)
    db.commit()

    return {"message": "Xoa thanh toan thanh cong"}
