import os
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.env_loader import load_env_file
from app.database import engine, Base

load_env_file()

VAT_RATE = 0.08

# import ALL models
from app.models import car, customer, user, rental_request, contract, payment, support_chat, review

from app.routers import car as car_router
from app.routers import customer as customer_router
from app.routers import user as user_router
from app.routers import rental_request as rental_request_router
from app.routers import contract as contract_router
from app.routers import payment as payment_router
from app.routers import reports as reports_router
from app.routers import ai_chat as ai_chat_router
from app.routers import support_chat as support_chat_router
from app.routers import review as review_router

app = FastAPI()

# CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
origins.extend(
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://([a-z0-9-]+\.)?trycloudflare\.com|https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# tạo bảng
Base.metadata.create_all(bind=engine)

car_columns = {column["name"] for column in inspect(engine).get_columns("cars")}
if "image_url" not in car_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE cars ADD COLUMN image_url VARCHAR"))

user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
if "name" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
if "reset_otp" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN reset_otp VARCHAR"))
if "reset_otp_expires_at" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN reset_otp_expires_at TIMESTAMP"))
if "created_at" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))

customer_columns = {column["name"] for column in inspect(engine).get_columns("customers")}
if "created_at" not in customer_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE customers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
if "reset_otp" not in customer_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE customers ADD COLUMN reset_otp VARCHAR"))
if "reset_otp_expires_at" not in customer_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE customers ADD COLUMN reset_otp_expires_at TIMESTAMP"))

payment_columns = {column["name"] for column in inspect(engine).get_columns("payments")}
payment_column_definitions = {
    "request_id": "INTEGER",
    "total_amount": "NUMERIC",
    "remaining_amount": "NUMERIC",
    "payment_type": "VARCHAR",
    "note": "VARCHAR",
    "paid_at": "TIMESTAMP",
}
for column_name, column_type in payment_column_definitions.items():
    if column_name not in payment_columns:
        with engine.begin() as connection:
            connection.execute(text(f"ALTER TABLE payments ADD COLUMN {column_name} {column_type}"))

for col_to_drop in ["method", "refunded_at"]:
    if col_to_drop in payment_columns:
        with engine.begin() as connection:
            try:
                connection.execute(text(f"ALTER TABLE payments DROP COLUMN {col_to_drop}"))
            except Exception as e:
                print(f"Error dropping column {col_to_drop}: {e}")

contract_columns = {column["name"] for column in inspect(engine).get_columns("contracts")}
contract_column_definitions = {
    "invoice_code": "VARCHAR",
    "invoice_status": "VARCHAR DEFAULT 'not_issued'",
    "invoice_issued_at": "TIMESTAMP",
    "customer_signed_at": "TIMESTAMP",
    "staff_signed_at": "TIMESTAMP",
    "signature_status": "VARCHAR DEFAULT 'unsigned'",
}
for column_name, column_type in contract_column_definitions.items():
    if column_name not in contract_columns:
        with engine.begin() as connection:
            connection.execute(text(f"ALTER TABLE contracts ADD COLUMN {column_name} {column_type}"))

with engine.begin() as connection:
    connection.execute(text("UPDATE payments SET payment_type = 'rental' WHERE payment_type IS NULL"))
    connection.execute(text("UPDATE payments SET total_amount = amount WHERE total_amount IS NULL"))
    connection.execute(text("UPDATE payments SET remaining_amount = amount WHERE remaining_amount IS NULL"))
    connection.execute(text("UPDATE contracts SET invoice_status = 'not_issued' WHERE invoice_status IS NULL"))
    connection.execute(text("UPDATE contracts SET signature_status = 'unsigned' WHERE signature_status IS NULL"))

if engine.dialect.name == "postgresql":
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        connection.execute(text("ALTER TABLE cars ADD COLUMN IF NOT EXISTS image_url VARCHAR"))
        connection.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS password VARCHAR"))
        connection.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_otp VARCHAR"))
        connection.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP"))
        connection.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        connection.execute(text("ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS pickup_location VARCHAR"))
        connection.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS request_id INTEGER"))
        connection.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS total_amount NUMERIC"))
        connection.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC"))
        connection.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR"))
        connection.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS note VARCHAR"))
        connection.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP"))
        connection.execute(text("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS invoice_code VARCHAR"))
        connection.execute(text("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS invoice_status VARCHAR DEFAULT 'not_issued'"))
        connection.execute(text("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMP"))
        connection.execute(text("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_signed_at TIMESTAMP"))
        connection.execute(text("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS staff_signed_at TIMESTAMP"))
        connection.execute(text("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_status VARCHAR DEFAULT 'unsigned'"))
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS customer_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS staff_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_email_lower ON customers (lower(email)) WHERE email IS NOT NULL AND email <> ''"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (lower(username))"))

# ensure default admin exists
from app.database import SessionLocal
from app.models.payment import Payment
from app.models.rental_request import RentalRequest
from app.models.user import User
from app.security import hash_password, is_password_hash


with SessionLocal() as session:
    admin_user = session.query(User).filter(User.username == "phamcongminh1368@gmail.com").first()
    if not admin_user:
        session.add(User(name="Admin", username="phamcongminh1368@gmail.com", password=hash_password("123456"), role="admin"))
        session.commit()
    elif not admin_user.name:
        admin_user.name = "Admin"
        if not is_password_hash(admin_user.password):
            admin_user.password = hash_password(admin_user.password)
        session.commit()
    elif not is_password_hash(admin_user.password):
        admin_user.password = hash_password(admin_user.password)
        session.commit()

with SessionLocal() as session:
    # Migrate existing customer passwords from users table to customers table
    customer_users = session.query(User).filter(User.role == "customer").all()
    if customer_users:
        from app.models.customer import Customer
        for u in customer_users:
            if u.password and is_password_hash(u.password):
                cust = session.query(Customer).filter(Customer.email.ilike(u.username)).first()
                if cust:
                    cust.password = u.password
        session.commit()
        
        # Delete user records with role="customer"
        session.query(User).filter(User.role == "customer").delete(synchronize_session=False)
        session.commit()

with SessionLocal() as session:
    approved_deposits = (
        session.query(Payment)
        .join(RentalRequest, Payment.request_id == RentalRequest.request_id)
        .filter(
            Payment.payment_type == "deposit",
            Payment.status.in_(["pending", "unpaid"]),
            RentalRequest.status.in_(["approved", "completed"]),
        )
        .all()
    )
    for deposit in approved_deposits:
        deposit.status = "paid"
        deposit.paid_at = deposit.paid_at or datetime.utcnow()
    completed_contracts = session.query(contract.Contract).filter(contract.Contract.status == "completed").all()
    for completed_contract in completed_contracts:
        if completed_contract.request_id:
            rental_request = session.query(RentalRequest).filter(
                RentalRequest.request_id == completed_contract.request_id
            ).first()
            if rental_request and rental_request.status != "completed":
                rental_request.status = "completed"

    rejected_payment_request_ids = [
        request_id
        for (request_id,) in session.query(Payment.request_id).filter(
            Payment.request_id.isnot(None),
            Payment.status.in_(["rejected", "cancelled", "refunded"]),
        ).distinct().all()
    ]
    if rejected_payment_request_ids:
        session.query(RentalRequest).filter(
            RentalRequest.request_id.in_(rejected_payment_request_ids),
            RentalRequest.status != "completed",
        ).update({RentalRequest.status: "rejected"}, synchronize_session=False)

    removed_invalid_contracts = []
    active_contracts = session.query(contract.Contract).filter(contract.Contract.status == "approved").all()
    rejected_payment_statuses = {"rejected", "cancelled", "refunded", "refund_pending"}
    for active_contract in active_contracts:
        related_payments = session.query(Payment).filter(Payment.contract_id == active_contract.contract_id).all()
        if active_contract.request_id:
            request_payments = session.query(Payment).filter(
                Payment.request_id == active_contract.request_id,
                Payment.contract_id.is_(None),
            ).all()
            related_payments.extend(request_payments)

        paid_amount = sum(
            float(payment.amount or 0)
            for payment in related_payments
            if str(payment.status or "").strip().lower() == "paid"
        )
        has_rejected_payment = any(
            str(payment.status or "").strip().lower() in rejected_payment_statuses
            for payment in related_payments
        )
        if has_rejected_payment or paid_amount + 0.01 < float(active_contract.total_price or 0):
            removed_invalid_contracts.append(active_contract.contract_id)
            if active_contract.request_id:
                rental_request = session.query(RentalRequest).filter(
                    RentalRequest.request_id == active_contract.request_id
                ).first()
                if rental_request and rental_request.status != "completed":
                    rental_request.status = "rejected"
            for related_payment in related_payments:
                if related_payment.contract_id == active_contract.contract_id:
                    related_payment.contract_id = None
            rented_car = session.query(car.Car).filter(car.Car.car_id == active_contract.car_id).first()
            if rented_car and str(rented_car.status or "").strip().lower() == "rented":
                rented_car.status = "available"
            session.delete(active_contract)

    rejected_contracts = session.query(contract.Contract).filter(contract.Contract.status == "rejected").all()
    for rejected_contract in rejected_contracts:
        removed_invalid_contracts.append(rejected_contract.contract_id)
        related_payments = session.query(Payment).filter(Payment.contract_id == rejected_contract.contract_id).all()
        for related_payment in related_payments:
            related_payment.contract_id = None
        rented_car = session.query(car.Car).filter(car.Car.car_id == rejected_contract.car_id).first()
        if rented_car and str(rented_car.status or "").strip().lower() == "rented":
            rented_car.status = "available"
        session.delete(rejected_contract)

    if approved_deposits or completed_contracts or rejected_payment_request_ids or removed_invalid_contracts:
        session.commit()

@app.get("/")
def home():
    return {"message": "API chạy OK"}

# include router
app.include_router(car_router.router)
app.include_router(customer_router.router)
app.include_router(user_router.router)
app.include_router(rental_request_router.router)
app.include_router(contract_router.router)
app.include_router(payment_router.router)
app.include_router(reports_router.router)
app.include_router(ai_chat_router.router)
app.include_router(support_chat_router.router)
app.include_router(review_router.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=os.getenv("BACKEND_HOST", "0.0.0.0"), port=8000, reload=True)
