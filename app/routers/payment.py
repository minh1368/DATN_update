from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db
from app.models.payment import Payment
from app.models.contract import Contract
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

# GET payments
@router.get("/", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db)):
    return db.query(Payment).all()

# CREATE payment
@router.post("/")
def create_payment(data: PaymentCreate, db: Session = Depends(get_db)):

    contract = db.query(Contract).filter(
        Contract.contract_id == data.contract_id
    ).first()

    if not contract:
        raise HTTPException(404, "Contract không tồn tại")

    if contract.status != "approved":
        raise HTTPException(400, "Contract chưa được duyệt")

    # check đã có payment chưa
    existing = db.query(Payment).filter(
        Payment.contract_id == data.contract_id
    ).first()

    if existing:
        raise HTTPException(400, "Đã tồn tại payment")

    payment = Payment(
        contract_id=data.contract_id,
        amount=contract.total_price,
        method=data.method,
        status="unpaid"
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment

# PAY (update status)
@router.put("/{payment_id}/pay")
def pay(payment_id: int, db: Session = Depends(get_db)):

    payment = db.query(Payment).filter(
        Payment.payment_id == payment_id
    ).first()

    if not payment:
        raise HTTPException(404, "Payment không tồn tại")

    if payment.status == "paid":
        raise HTTPException(400, "Đã thanh toán")

    payment.status = "paid"

    db.commit()

    return {"message": "Thanh toán thành công"}