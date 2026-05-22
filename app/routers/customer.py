from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.dependencies import get_db, require_staff_or_admin, require_admin
from app.models.customer import Customer
from app.models.contract import Contract
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


def normalize_email(email: str | None) -> str | None:
    if email is None:
        return None
    value = email.strip().lower()
    return value or None


def ensure_unique_customer_email(db: Session, email: str | None, customer_id: int | None = None):
    normalized_email = normalize_email(email)
    if not normalized_email:
        return

    query = db.query(Customer).filter(Customer.email.ilike(normalized_email))
    if customer_id is not None:
        query = query.filter(Customer.customer_id != customer_id)
    if query.first():
        raise HTTPException(status_code=400, detail="Email da duoc su dung")


@router.get("/", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    staff_emails = [
        account.username.lower()
        for account in db.query(User).filter(User.role.in_(["admin", "staff"])).all()
        if account.username and "@" in account.username
    ]
    customers = db.query(Customer).all()
    return [
        customer
        for customer in customers
        if not customer.email or customer.email.lower() not in staff_emails
    ]


@router.get("/by-email/{email}", response_model=CustomerResponse)
def get_customer_by_email(email: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == email).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khach hang khong ton tai")
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khach hang khong ton tai")
    return customer


@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    data = customer.model_dump()
    data["email"] = normalize_email(data.get("email"))
    data["password"] = data.get("password") or ""
    ensure_unique_customer_email(db, data.get("email"))
    new_customer = Customer(**data)
    db.add(new_customer)

    try:
        db.commit()
        db.refresh(new_customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="So dien thoai hoac email da ton tai"
        )

    return new_customer


@router.post("/public", response_model=CustomerResponse)
def create_customer_public(customer: CustomerCreate, db: Session = Depends(get_db)):
    data = customer.model_dump()
    data["email"] = normalize_email(data.get("email"))
    data["password"] = data.get("password") or ""
    ensure_unique_customer_email(db, data.get("email"))
    new_customer = Customer(**data)
    db.add(new_customer)

    try:
        db.commit()
        db.refresh(new_customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="So dien thoai hoac email da ton tai"
        )

    return new_customer


@router.put("/{customer_id}/profile", response_model=CustomerResponse)
def update_customer_profile(customer_id: int, customer_data: CustomerCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khach hang khong ton tai")

    data = customer_data.model_dump()
    data["email"] = normalize_email(data.get("email"))
    if data.get("password") is None or data.get("password") == "":
        data.pop("password", None)
    ensure_unique_customer_email(db, data.get("email"), customer_id)

    for field, value in data.items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="So dien thoai hoac email da ton tai"
        )

    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_data: CustomerCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khach hang khong ton tai")

    data = customer_data.model_dump()
    data["email"] = normalize_email(data.get("email"))
    if data.get("password") is None or data.get("password") == "":
        data.pop("password", None)
    ensure_unique_customer_email(db, data.get("email"), customer_id)

    for field, value in data.items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="So dien thoai hoac email da ton tai"
        )

    return customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), user: dict = Depends(require_admin)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Khach hang khong ton tai")

    contracts = db.query(Contract).filter(Contract.customer_id == customer_id).first()
    if contracts:
        raise HTTPException(status_code=400, detail="Khach hang co hop dong, khong the xoa")

    db.delete(customer)
    db.commit()

    return {"message": "Xoa thanh cong"}
