from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, require_staff_or_admin
from app.models.payment import Payment
from app.models.contract import Contract
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    return db.query(Payment).all()


@router.post("/", response_model=PaymentResponse)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    contract = db.query(Contract).filter(Contract.contract_id == data.contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract khong ton tai")

    if contract.status != "approved":
        raise HTTPException(status_code=400, detail="Contract chua duoc duyet")

    existing = db.query(Payment).filter(Payment.contract_id == data.contract_id).first()

    if existing:
        raise HTTPException(status_code=400, detail="Da ton tai payment")

    payment = Payment(
        contract_id=data.contract_id,
        amount=contract.total_price,
        method=data.method,
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
        raise HTTPException(404, "Payment khong ton tai")

    if payment.status == "paid":
        raise HTTPException(400, "Da thanh toan")

    payment.status = "paid"

    db.commit()

    return {"message": "Thanh toan thanh cong"}


@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()

    if not payment:
        raise HTTPException(404, "Payment khong ton tai")

    db.delete(payment)
    db.commit()

    return {"message": "Xoa thanh toan thanh cong"}
