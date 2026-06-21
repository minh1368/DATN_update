import random
from datetime import date, timedelta

from app.database import SessionLocal, Base, engine
from app.models.car import Car
from app.models.customer import Customer
from app.models.rental_request import RentalRequest
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.review import Review

CAR_BRANDS = [
    ("Toyota", "Camry"),
    ("Honda", "City"),
    ("Toyota", "Fortuner"),
    ("Mitsubishi", "Outlander"),
    ("Ford", "Everest"),
    ("Kia", "Morning"),
    ("Mazda", "CX-5"),
    ("Hyundai", "Santa Fe"),
    ("VinFast", "VF 8"),
    ("Nissan", "X-Trail"),
]

CUSTOMER_NAMES = [
    "Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E",
    "Đỗ Thị F", "Vũ Văn G", "Bùi Thị H", "Ngô Văn I", "Dương Thị K"
]

PAYMENT_METHODS = ["cash", "transfer"]
STATUSES = ["available", "rented"]
REVIEW_MESSAGES = [
    "Xe sạch, thủ tục nhanh và nhân viên hỗ trợ rất rõ ràng.",
    "Giá thuê hợp lý, xe đúng như thông tin trên hệ thống.",
    "Quy trình đặt xe và thanh toán dễ theo dõi.",
    "Tôi hài lòng với chất lượng xe và cách xử lý yêu cầu.",
]


def create_schema():
    Base.metadata.create_all(bind=engine)


def seed_cars(db, count=20):
    existing = db.query(Car).count()
    if existing >= count:
        return

    for i in range(count - existing):
        brand, model = random.choice(CAR_BRANDS)
        car = Car(
            name=f"{brand} {model}",
            brand=brand,
            license_plate=f"30A-{random.randint(1000, 9999)}",
            price_per_day=random.randint(800000, 2000000),
            status="available",
            color=random.choice(["Đỏ", "Đen", "Trắng", "Bạc", "Xanh"]),
            seats=random.choice([4, 5, 7]),
            fuel_type=random.choice(["xăng", "dầu", "điện"]),
            transmission=random.choice(["tự động", "số sàn"]),
            year=random.randint(2016, 2024),
            description="Xe thuê chất lượng, bảo dưỡng định kỳ."
        )
        db.add(car)
    db.commit()


def seed_customers(db, count=30):
    existing = db.query(Customer).count()
    if existing >= count:
        return

    for i in range(count - existing):
        name = random.choice(CUSTOMER_NAMES)
        customer = Customer(
            name=f"{name} {random.randint(1, 100)}",
            phone=f"09{random.randint(10000000, 99999999)}",
            email=f"user{random.randint(1000,9999)}@example.com",
            address=random.choice(["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"])
        )
        db.add(customer)
    db.commit()


def seed_requests(db, count=100):
    existing = db.query(RentalRequest).count()
    if existing >= count:
        return

    cars = db.query(Car).all()
    customers = db.query(Customer).all()
    for i in range(count - existing):
        car = random.choice(cars)
        customer = random.choice(customers)
        start_date = date.today() - timedelta(days=random.randint(0, 120))
        end_date = start_date + timedelta(days=random.randint(1, 10))
        status = random.choice(["pending", "approved", "rejected"])
        req = RentalRequest(
            customer_id=customer.customer_id,
            car_id=car.car_id,
            start_date=start_date,
            end_date=end_date,
            status=status
        )
        db.add(req)
    db.commit()


def seed_contracts_and_payments(db):
    approved_requests = db.query(RentalRequest).filter(RentalRequest.status == "approved").all()
    existing_contracts = db.query(Contract).count()
    for req in approved_requests[:50]:
        if db.query(Contract).filter(Contract.request_id == req.request_id).first():
            continue

        car = db.query(Car).filter(Car.car_id == req.car_id).first()
        if not car or car.status != "available":
            continue

        days = max(1, (req.end_date - req.start_date).days + 1)
        rental_fee = float(days * car.price_per_day)
        total_price = rental_fee + round(rental_fee * 0.08)
        contract = Contract(
            request_id=req.request_id,
            customer_id=req.customer_id,
            car_id=req.car_id,
            start_date=req.start_date,
            end_date=req.end_date,
            total_price=total_price,
            status="approved"
        )
        db.add(contract)
        car.status = "rented"

    db.commit()

    contracts = db.query(Contract).filter(Contract.status == "approved").all()
    for contract in contracts[:40]:
        if db.query(Payment).filter(Payment.contract_id == contract.contract_id).first():
            continue

        payment = Payment(
            contract_id=contract.contract_id,
            amount=contract.total_price,
            method=random.choice(PAYMENT_METHODS),
            status="paid"
        )
        db.add(payment)
    db.commit()


def seed_reviews(db, count=4):
    existing = db.query(Review).count()
    if existing >= count:
        return

    customers = db.query(Customer).all()
    if not customers:
        return

    for index in range(count - existing):
        customer = customers[index % len(customers)]
        db.add(Review(
            customer_id=customer.customer_id,
            name=customer.name,
            email=customer.email,
            rating=random.choice([4, 5]),
            message=REVIEW_MESSAGES[index % len(REVIEW_MESSAGES)],
        ))
    db.commit()


def main():
    create_schema()
    db = SessionLocal()
    try:
        seed_cars(db)
        seed_customers(db)
        seed_requests(db)
        seed_contracts_and_payments(db)
        seed_reviews(db)
        print("Seed data completed.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
