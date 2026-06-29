import os

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

user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
if "username" in user_columns and "email" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users RENAME COLUMN username TO email"))
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}

car_columns = {column["name"] for column in inspect(engine).get_columns("cars")}
if "image_url" not in car_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE cars ADD COLUMN image_url VARCHAR"))

if "email" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
    user_columns.add("email")
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

with engine.begin() as connection:
    connection.execute(text("UPDATE payments SET total_amount = amount WHERE total_amount IS NULL"))
    connection.execute(text("UPDATE payments SET remaining_amount = amount WHERE remaining_amount IS NULL"))

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
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS customer_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS staff_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("""
            UPDATE reviews
            SET email = customers.email
            FROM customers
            WHERE reviews.customer_id = customers.customer_id
              AND (reviews.email IS NULL OR reviews.email = '')
        """))
        connection.execute(text("DELETE FROM reviews WHERE email IS NULL OR email = ''"))
        connection.execute(text("""
            WITH duplicated AS (
                SELECT car_id, license_plate,
                       ROW_NUMBER() OVER (PARTITION BY license_plate ORDER BY car_id) AS duplicate_order
                FROM cars
                WHERE license_plate IS NOT NULL AND license_plate <> ''
            )
            UPDATE cars
            SET license_plate = cars.license_plate || '-' || cars.car_id
            FROM duplicated
            WHERE cars.car_id = duplicated.car_id
              AND duplicated.duplicate_order > 1
        """))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_email_lower ON customers (lower(email)) WHERE email IS NOT NULL AND email <> ''"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email))"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cars_license_plate ON cars (license_plate) WHERE license_plate IS NOT NULL AND license_plate <> ''"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_contracts_request_id ON contracts (request_id)"))
        connection.execute(text("ALTER TABLE reviews ALTER COLUMN email SET NOT NULL"))

# ensure default admin exists
from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password, is_password_hash


with SessionLocal() as session:
    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "phamcongminh1368@gmail.com").strip().lower()
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "123456")
    admin_name = os.getenv("DEFAULT_ADMIN_NAME", "Admin").strip() or "Admin"
    admin_user = session.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        session.add(User(name=admin_name, email=admin_email, password=hash_password(admin_password), role="admin"))
        session.commit()
    elif not admin_user.name:
        admin_user.name = admin_name
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
            if u.password:
                cust = session.query(Customer).filter(Customer.email.ilike(u.email)).first()
                if cust:
                    cust.password = u.password if is_password_hash(u.password) else hash_password(u.password)
        session.commit()
        
        # Delete user records with role="customer"
        session.query(User).filter(User.role == "customer").delete(synchronize_session=False)
        session.commit()

with SessionLocal() as session:
    from app.models.customer import Customer

    password_data_changed = False
    for account in session.query(User).all():
        if account.password and not is_password_hash(account.password):
            account.password = hash_password(account.password)
            password_data_changed = True
    for customer_account in session.query(Customer).all():
        if customer_account.password and not is_password_hash(customer_account.password):
            customer_account.password = hash_password(customer_account.password)
            password_data_changed = True
    if password_data_changed:
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
