from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timedelta

from app.dependencies import get_db, require_staff_or_admin, require_admin
from app.models.customer import Customer
from app.models.contract import Contract
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.schemas.user import UserLogin, PasswordResetRequest, PasswordResetVerify, PasswordResetConfirm
from app.security import hash_password, is_password_hash, verify_password, create_access_token
from app.routers.user import generate_otp, send_reset_otp_email

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
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")


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
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    return customer


@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    data = customer.model_dump()
    data["email"] = normalize_email(data.get("email"))
    
    raw_password = data.get("password") or ""
    data["password"] = hash_password(raw_password) if raw_password else ""
    
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
            detail="Số điện thoại hoặc email đã tồn tại"
        )

    return new_customer


@router.post("/public", response_model=CustomerResponse)
def create_customer_public(customer: CustomerCreate, db: Session = Depends(get_db)):
    data = customer.model_dump()
    data["email"] = normalize_email(data.get("email"))
    
    raw_password = data.get("password") or ""
    data["password"] = hash_password(raw_password) if raw_password else ""
    
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
            detail="Số điện thoại hoặc email đã tồn tại"
        )

    return new_customer


@router.put("/{customer_id}/profile", response_model=CustomerResponse)
def update_customer_profile(customer_id: int, customer_data: CustomerCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")

    data = customer_data.model_dump()
    data["email"] = normalize_email(data.get("email"))
    
    if data.get("password") is None or data.get("password") == "":
        data.pop("password", None)
    else:
        data["password"] = hash_password(data["password"])
        
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
            detail="Số điện thoại hoặc email đã tồn tại"
        )

    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_data: CustomerCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")

    data = customer_data.model_dump()
    data["email"] = normalize_email(data.get("email"))
    
    if data.get("password") is None or data.get("password") == "":
        data.pop("password", None)
    else:
        data["password"] = hash_password(data["password"])
        
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
            detail="Số điện thoại hoặc email đã tồn tại"
        )

    return customer


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

# Customer Auth Endpoints

@router.post("/login", response_model=CustomerResponse)
def login_customer(credentials: UserLogin, db: Session = Depends(get_db)):
    email = normalize_email(credentials.username)
    if not email:
        raise HTTPException(status_code=400, detail="Email không hợp lệ")
        
    customer = db.query(Customer).filter(Customer.email.ilike(email)).first()
    if not customer or not verify_password(credentials.password, customer.password):
        raise HTTPException(status_code=401, detail="Tài khoản hoặc mật khẩu sai")

    token = create_access_token({
        "user_id": customer.customer_id,
        "username": customer.email,
        "role": "customer",
    })
    
    customer.token = token
    return customer


@router.post("/reset-password/request")
def request_customer_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    email = normalize_email(payload.username)
    customer = db.query(Customer).filter(Customer.email.ilike(email)).first()
    otp = generate_otp()
    expires_at = datetime.now() + timedelta(minutes=10)
    
    if customer:
        customer.reset_otp = otp
        customer.reset_otp_expires_at = expires_at
        db.commit()
        try:
            send_reset_otp_email(customer.email, otp)
        except RuntimeError as exc:
            customer.reset_otp = None
            customer.reset_otp_expires_at = None
            db.commit()
            raise HTTPException(status_code=500, detail=f"Lỗi gửi email OTP: {exc}")

    return {"message": "Mã OTP đã được gửi, hãy kiểm tra email."}


@router.post("/reset-password/verify")
def verify_customer_password_reset(payload: PasswordResetVerify, db: Session = Depends(get_db)):
    email = normalize_email(payload.username)
    customer = db.query(Customer).filter(Customer.email.ilike(email)).first()
    
    if not customer or not customer.reset_otp or not customer.reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="Mã OTP không hợp lệ hoặc đã hết hạn.")
        
    if datetime.now() > customer.reset_otp_expires_at:
        customer.reset_otp = None
        customer.reset_otp_expires_at = None
        db.commit()
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn. Vui lòng yêu cầu lại.")
        
    if payload.otp.strip() != customer.reset_otp:
        raise HTTPException(status_code=400, detail="Mã OTP không đúng.")

    return {"message": "Mã OTP hợp lệ."}


@router.post("/reset-password/confirm")
def confirm_customer_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    email = normalize_email(payload.username)
    customer = db.query(Customer).filter(Customer.email.ilike(email)).first()
    
    if not customer or not customer.reset_otp or not customer.reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.")
        
    if datetime.now() > customer.reset_otp_expires_at:
        customer.reset_otp = None
        customer.reset_otp_expires_at = None
        db.commit()
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn. Vui lòng yêu cầu lại.")
        
    if payload.otp.strip() != customer.reset_otp:
        raise HTTPException(status_code=400, detail="Mã OTP không đúng.")
        
    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự.")

    customer.password = hash_password(payload.new_password)
    customer.reset_otp = None
    customer.reset_otp_expires_at = None
    db.commit()
    
    return {"message": "Mật khẩu đã được đặt lại thành công."}
