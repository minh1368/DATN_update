import os
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
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

if engine.dialect.name == "postgresql":
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR"))
        connection.execute(text("ALTER TABLE cars ADD COLUMN IF NOT EXISTS image_url VARCHAR"))
        connection.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS password VARCHAR"))
        connection.execute(text("ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS pickup_location VARCHAR"))
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS customer_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS staff_last_read_message_id INTEGER DEFAULT 0"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_email_lower ON customers (lower(email)) WHERE email IS NOT NULL AND email <> ''"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (lower(username))"))

# ensure default admin exists
from app.database import SessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.car import Car
from app.models.rental_request import RentalRequest
from app.models.contract import Contract
from app.models.payment import Payment
from app.security import hash_password, is_password_hash

SAMPLE_CUSTOMERS = [
    {"name": "Nguyen Minh Anh", "phone": "0901000001", "email": "khachhang01@phuongdong.vn", "password": "123456", "address": "Ba Dinh, Ha Noi"},
    {"name": "Tran Quoc Bao", "phone": "0901000002", "email": "khachhang02@phuongdong.vn", "password": "123456", "address": "Hoan Kiem, Ha Noi"},
    {"name": "Le Thanh Binh", "phone": "0901000003", "email": "khachhang03@phuongdong.vn", "password": "123456", "address": "Dong Da, Ha Noi"},
    {"name": "Pham Gia Han", "phone": "0901000004", "email": "khachhang04@phuongdong.vn", "password": "123456", "address": "Cau Giay, Ha Noi"},
    {"name": "Do Hoang Long", "phone": "0901000005", "email": "khachhang05@phuongdong.vn", "password": "123456", "address": "Thanh Xuan, Ha Noi"},
    {"name": "Vu Ngoc Linh", "phone": "0901000006", "email": "khachhang06@phuongdong.vn", "password": "123456", "address": "Hai Ba Trung, Ha Noi"},
    {"name": "Hoang Tuan Kiet", "phone": "0901000007", "email": "khachhang07@phuongdong.vn", "password": "123456", "address": "Long Bien, Ha Noi"},
    {"name": "Bui Phuong Thao", "phone": "0901000008", "email": "khachhang08@phuongdong.vn", "password": "123456", "address": "Tay Ho, Ha Noi"},
    {"name": "Dang Duc Huy", "phone": "0901000009", "email": "khachhang09@phuongdong.vn", "password": "123456", "address": "Nam Tu Liem, Ha Noi"},
    {"name": "Ngo Khanh Ly", "phone": "0901000010", "email": "khachhang10@phuongdong.vn", "password": "123456", "address": "Bac Tu Liem, Ha Noi"},
    {"name": "Cao Viet Anh", "phone": "0901000011", "email": "khachhang11@phuongdong.vn", "password": "123456", "address": "Ha Dong, Ha Noi"},
    {"name": "Mai Thu Trang", "phone": "0901000012", "email": "khachhang12@phuongdong.vn", "password": "123456", "address": "Hoang Mai, Ha Noi"},
    {"name": "Phan Trung Hieu", "phone": "0901000013", "email": "khachhang13@phuongdong.vn", "password": "123456", "address": "Gia Lam, Ha Noi"},
    {"name": "Dinh Bao Ngoc", "phone": "0901000014", "email": "khachhang14@phuongdong.vn", "password": "123456", "address": "Dong Anh, Ha Noi"},
    {"name": "Ly Hai Nam", "phone": "0901000015", "email": "khachhang15@phuongdong.vn", "password": "123456", "address": "Soc Son, Ha Noi"},
    {"name": "Truong Khanh Chi", "phone": "0901000016", "email": "khachhang16@phuongdong.vn", "password": "123456", "address": "Me Linh, Ha Noi"},
    {"name": "Ta Minh Quan", "phone": "0901000017", "email": "khachhang17@phuongdong.vn", "password": "123456", "address": "Son Tay, Ha Noi"},
    {"name": "Ha Ngoc Mai", "phone": "0901000018", "email": "khachhang18@phuongdong.vn", "password": "123456", "address": "Thanh Tri, Ha Noi"},
    {"name": "Kieu Anh Tu", "phone": "0901000019", "email": "khachhang19@phuongdong.vn", "password": "123456", "address": "Thuong Tin, Ha Noi"},
    {"name": "Lam Bao Chau", "phone": "0901000020", "email": "khachhang20@phuongdong.vn", "password": "123456", "address": "Phu Xuyen, Ha Noi"},
    {"name": "Nguyen Viet Hoang", "phone": "0901000021", "email": "khachhang21@phuongdong.vn", "password": "123456", "address": "Quoc Oai, Ha Noi"},
    {"name": "Tran Dieu Linh", "phone": "0901000022", "email": "khachhang22@phuongdong.vn", "password": "123456", "address": "Thach That, Ha Noi"},
    {"name": "Le Minh Khoi", "phone": "0901000023", "email": "khachhang23@phuongdong.vn", "password": "123456", "address": "Dan Phuong, Ha Noi"},
    {"name": "Pham Nhat Minh", "phone": "0901000024", "email": "khachhang24@phuongdong.vn", "password": "123456", "address": "Hoai Duc, Ha Noi"},
    {"name": "Do Hai Yen", "phone": "0901000025", "email": "khachhang25@phuongdong.vn", "password": "123456", "address": "My Duc, Ha Noi"},
    {"name": "Vu Tien Dat", "phone": "0901000026", "email": "khachhang26@phuongdong.vn", "password": "123456", "address": "Ung Hoa, Ha Noi"},
    {"name": "Hoang Minh Chau", "phone": "0901000027", "email": "khachhang27@phuongdong.vn", "password": "123456", "address": "Chu Long, Ba Vi, Ha Noi"},
    {"name": "Bui Anh Dung", "phone": "0901000028", "email": "khachhang28@phuongdong.vn", "password": "123456", "address": "Phuc Tho, Ha Noi"},
    {"name": "Dang Nhat Ha", "phone": "0901000029", "email": "khachhang29@phuongdong.vn", "password": "123456", "address": "Ba Vi, Ha Noi"},
    {"name": "Ngo Bao Tram", "phone": "0901000030", "email": "khachhang30@phuongdong.vn", "password": "123456", "address": "Thanh Oai, Ha Noi"},
]


def ensure_sample_customers(session):
    for data in SAMPLE_CUSTOMERS:
        email = data["email"].strip().lower()
        customer = session.query(Customer).filter(Customer.email.ilike(email)).first()
        if not customer:
            customer = Customer(
                name=data["name"],
                phone=data["phone"],
                email=email,
                password=data["password"],
                address=data["address"],
            )
            session.add(customer)
            session.flush()
        else:
            if not customer.password:
                customer.password = data["password"]

        user = session.query(User).filter(User.username.ilike(email)).first()
        if not user:
            session.add(User(
                name=customer.name,
                username=email,
                password=hash_password(data["password"]),
                role="customer",
            ))
        elif user.role == "customer":
            user.name = customer.name
            if not user.password or not is_password_hash(user.password):
                user.password = hash_password(data["password"])


SAMPLE_RENTAL_HISTORY = [
    {"customer_email": "khachhang01@phuongdong.vn", "car_name": "Toyota Vios", "start": date(2025, 1, 5), "end": date(2025, 1, 7), "pickup": "Ba Dinh, Ha Noi"},
    {"customer_email": "khachhang02@phuongdong.vn", "car_name": "VinFast VF 3", "start": date(2025, 2, 10), "end": date(2025, 2, 12), "pickup": "Hoan Kiem, Ha Noi"},
    {"customer_email": "khachhang03@phuongdong.vn", "car_name": "Mazda 3", "start": date(2025, 3, 3), "end": date(2025, 3, 6), "pickup": "Dong Da, Ha Noi"},
    {"customer_email": "khachhang04@phuongdong.vn", "car_name": "Hyundai Accent", "start": date(2025, 3, 21), "end": date(2025, 3, 22), "pickup": "Cau Giay, Ha Noi"},
    {"customer_email": "khachhang05@phuongdong.vn", "car_name": "Toyota Innova", "start": date(2025, 4, 8), "end": date(2025, 4, 11), "pickup": "Thanh Xuan, Ha Noi"},
    {"customer_email": "khachhang06@phuongdong.vn", "car_name": "VinFast VF 5", "start": date(2025, 5, 13), "end": date(2025, 5, 15), "pickup": "Hai Ba Trung, Ha Noi"},
    {"customer_email": "khachhang07@phuongdong.vn", "car_name": "Kia Seltos", "start": date(2025, 6, 2), "end": date(2025, 6, 8), "pickup": "Long Bien, Ha Noi"},
    {"customer_email": "khachhang08@phuongdong.vn", "car_name": "Mazda CX-5", "start": date(2025, 6, 25), "end": date(2025, 6, 27), "pickup": "Tay Ho, Ha Noi"},
    {"customer_email": "khachhang09@phuongdong.vn", "car_name": "VinFast VF 6", "start": date(2025, 7, 10), "end": date(2025, 7, 14), "pickup": "Nam Tu Liem, Ha Noi"},
    {"customer_email": "khachhang10@phuongdong.vn", "car_name": "VinFast Lux A2.0", "start": date(2025, 8, 5), "end": date(2025, 8, 6), "pickup": "Bac Tu Liem, Ha Noi"},
    {"customer_email": "khachhang11@phuongdong.vn", "car_name": "Tesla Model 3", "start": date(2025, 8, 22), "end": date(2025, 8, 25), "pickup": "Ha Dong, Ha Noi"},
    {"customer_email": "khachhang12@phuongdong.vn", "car_name": "Tesla Model Y", "start": date(2025, 9, 12), "end": date(2025, 9, 15), "pickup": "Hoang Mai, Ha Noi"},
    {"customer_email": "khachhang13@phuongdong.vn", "car_name": "Hyundai SantaFe", "start": date(2025, 10, 3), "end": date(2025, 10, 5), "pickup": "Gia Lam, Ha Noi"},
    {"customer_email": "khachhang14@phuongdong.vn", "car_name": "VinFast Lux SA2.0", "start": date(2025, 10, 20), "end": date(2025, 10, 24), "pickup": "Dong Anh, Ha Noi"},
    {"customer_email": "khachhang15@phuongdong.vn", "car_name": "Toyota Vios", "start": date(2025, 11, 8), "end": date(2025, 11, 10), "pickup": "Soc Son, Ha Noi"},
    {"customer_email": "khachhang16@phuongdong.vn", "car_name": "VinFast VF 3", "start": date(2025, 12, 1), "end": date(2025, 12, 5), "pickup": "Me Linh, Ha Noi"},
    {"customer_email": "khachhang17@phuongdong.vn", "car_name": "Mazda CX-5", "start": date(2025, 12, 18), "end": date(2025, 12, 20), "pickup": "Son Tay, Ha Noi"},
    {"customer_email": "khachhang18@phuongdong.vn", "car_name": "Toyota Innova", "start": date(2026, 1, 8), "end": date(2026, 1, 10), "pickup": "Thanh Tri, Ha Noi"},
    {"customer_email": "khachhang19@phuongdong.vn", "car_name": "VinFast VF 5", "start": date(2026, 1, 24), "end": date(2026, 1, 25), "pickup": "Thuong Tin, Ha Noi"},
    {"customer_email": "khachhang20@phuongdong.vn", "car_name": "Kia Seltos", "start": date(2026, 2, 14), "end": date(2026, 2, 17), "pickup": "Phu Xuyen, Ha Noi"},
    {"customer_email": "khachhang21@phuongdong.vn", "car_name": "VinFast VF 6", "start": date(2026, 3, 4), "end": date(2026, 3, 6), "pickup": "Quoc Oai, Ha Noi"},
    {"customer_email": "khachhang22@phuongdong.vn", "car_name": "Tesla Model 3", "start": date(2026, 3, 22), "end": date(2026, 3, 26), "pickup": "Thach That, Ha Noi"},
    {"customer_email": "khachhang23@phuongdong.vn", "car_name": "VinFast Lux A2.0", "start": date(2026, 4, 9), "end": date(2026, 4, 12), "pickup": "Dan Phuong, Ha Noi"},
    {"customer_email": "khachhang24@phuongdong.vn", "car_name": "Hyundai SantaFe", "start": date(2026, 5, 3), "end": date(2026, 5, 5), "pickup": "Hoai Duc, Ha Noi"},
    {"customer_email": "khachhang25@phuongdong.vn", "car_name": "VinFast Lux SA2.0", "start": date(2026, 5, 24), "end": date(2026, 5, 26), "pickup": "My Duc, Ha Noi", "contract_status": "approved", "payment_status": "unpaid"},
]


def ensure_sample_rental_history(session):
    cars = session.query(Car).order_by(Car.car_id).all()
    if not cars:
        return

    car_by_name = {str(car.name or "").strip().lower(): car for car in cars}

    for index, data in enumerate(SAMPLE_RENTAL_HISTORY):
        customer = session.query(Customer).filter(Customer.email.ilike(data["customer_email"])).first()
        car = car_by_name.get(data["car_name"].strip().lower()) or cars[index % len(cars)]
        if not customer or not car:
            continue

        start_date = data["start"]
        end_date = data["end"]
        pickup_location = data["pickup"]
        contract_status = data.get("contract_status", "completed")
        payment_status = data.get("payment_status", "paid" if contract_status == "completed" else "unpaid")
        method = "cash" if index % 2 == 0 else "transfer"
        days = (end_date - start_date).days + 1
        total_price = float(days * float(car.price_per_day or 0))

        rental_request = (
            session.query(RentalRequest)
            .filter(
                RentalRequest.customer_id == customer.customer_id,
                RentalRequest.car_id == car.car_id,
                RentalRequest.start_date == start_date,
                RentalRequest.end_date == end_date,
                RentalRequest.pickup_location == pickup_location,
            )
            .first()
        )
        if not rental_request:
            rental_request = RentalRequest(
                customer_id=customer.customer_id,
                car_id=car.car_id,
                start_date=start_date,
                end_date=end_date,
                pickup_location=pickup_location,
                status="approved",
            )
            session.add(rental_request)
            session.flush()
        else:
            rental_request.status = "approved"

        contract = session.query(Contract).filter(Contract.request_id == rental_request.request_id).first()
        if not contract:
            contract = Contract(
                request_id=rental_request.request_id,
                customer_id=customer.customer_id,
                car_id=car.car_id,
                start_date=start_date,
                end_date=end_date,
                total_price=total_price,
                status=contract_status,
            )
            session.add(contract)
            session.flush()
        else:
            contract.customer_id = customer.customer_id
            contract.car_id = car.car_id
            contract.start_date = start_date
            contract.end_date = end_date
            contract.total_price = total_price
            contract.status = contract_status

        payment = session.query(Payment).filter(Payment.contract_id == contract.contract_id).first()
        if not payment:
            payment = Payment(
                contract_id=contract.contract_id,
                amount=total_price,
                method=method,
                status=payment_status,
            )
            session.add(payment)
        else:
            payment.amount = total_price
            payment.method = method
            payment.status = payment_status

        if contract_status == "approved" and start_date <= date.today() <= end_date:
            car.status = "rented"


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
    ensure_sample_customers(session)
    ensure_sample_rental_history(session)
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
