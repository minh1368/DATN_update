from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.dependencies import get_db, require_staff_or_admin, require_admin
from app.models.customer import Customer
from app.models.contract import Contract
from app.schemas.customer import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])

# GET customers
@router.get("/", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    return db.query(Customer).all()

# POST customer
@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    new_customer = Customer(**customer.dict())
    db.add(new_customer)

    try:
        db.commit()
        db.refresh(new_customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Số điện thoại hoặc email đã tồn tại"
        )

    return new_customer

# PUT customer
@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_data: CustomerCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")

    for field, value in customer_data.dict().items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Số điện thoại hoặc email đã tồn tại"
        )

    return customer

# DELETE customer
@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), user: dict = Depends(require_admin)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")

    contracts = db.query(Contract).filter(Contract.customer_id == customer_id).first()
    if contracts:
        raise HTTPException(status_code=400, detail="Khách hàng có hợp đồng, không thể xóa")

    db.delete(customer)
    db.commit()
    
    return {"message": "Xóa thành công"}