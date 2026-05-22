import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.env_loader import load_env_file
from app.database import engine, Base

load_env_file()

# import ALL models
from app.models import car, customer, user, rental_request, contract, payment, support_chat

from app.routers import car as car_router
from app.routers import customer as customer_router
from app.routers import user as user_router
from app.routers import rental_request as rental_request_router
from app.routers import contract as contract_router
from app.routers import payment as payment_router
from app.routers import reports as reports_router
from app.routers import ai_chat as ai_chat_router
from app.routers import support_chat as support_chat_router

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
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# tạo bảng
Base.metadata.create_all(bind=engine)

if engine.dialect.name == "postgresql":
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR"))
        connection.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS password VARCHAR"))
        connection.execute(text("ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS pickup_location VARCHAR"))
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS customer_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS staff_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_email_lower ON customers (lower(email)) WHERE email IS NOT NULL AND email <> ''"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (lower(username))"))

# ensure default admin exists
from app.database import SessionLocal
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=os.getenv("BACKEND_HOST", "0.0.0.0"), port=8000, reload=True)
