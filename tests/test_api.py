import os
import unittest
from datetime import date

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi import HTTPException

from app.database import Base, SessionLocal, engine
from app.models.car import Car
from app.models.customer import Customer
from app.models.user import User
from app.routers.rental_request import create_customer_request
from app.routers.user import login_user, register_user
from app.schemas.rental_request import RentalRequestCreate
from app.schemas.user import UserLogin, UserRegister
from app.security import is_password_hash


class ApiLogicTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    def test_register_hashes_password_and_login_succeeds(self):
        db = SessionLocal()
        try:
            response = register_user(UserRegister(username="customer@example.com", password="secret123"), db)
            self.assertEqual(response.password, "")

            login = login_user(UserLogin(username="customer@example.com", password="secret123"), db)
            self.assertEqual(login.role, "customer")
            self.assertEqual(login.password, "")
        finally:
            db.close()

    def test_password_hash_is_stored_in_database(self):
        db = SessionLocal()
        try:
            register_user(UserRegister(username="hashcheck@example.com", password="secret123"), db)
            user = db.query(User).filter(User.username == "hashcheck@example.com").first()
            self.assertIsNotNone(user)
            self.assertTrue(is_password_hash(user.password))
            self.assertNotEqual(user.password, "secret123")
        finally:
            db.close()

    def test_rental_request_rejects_overlapping_booking(self):
        db = SessionLocal()
        try:
            car = Car(
                name="Toyota Vios",
                brand="Toyota",
                license_plate="30A-11111",
                price_per_day=600000,
                status="available",
            )
            customer = Customer(name="Nguyen Van A", phone="0900000001", email="a@example.com")
            db.add_all([car, customer])
            db.commit()
            db.refresh(car)
            db.refresh(customer)

            first = create_customer_request(
                RentalRequestCreate(
                    customer_id=customer.customer_id,
                    car_id=car.car_id,
                    start_date=date(2026, 6, 1),
                    end_date=date(2026, 6, 5),
                ),
                db,
            )
            self.assertEqual(first.status, "pending")

            with self.assertRaises(HTTPException) as context:
                create_customer_request(
                    RentalRequestCreate(
                        customer_id=customer.customer_id,
                        car_id=car.car_id,
                        start_date=date(2026, 6, 3),
                        end_date=date(2026, 6, 7),
                    ),
                    db,
                )
            self.assertEqual(context.exception.status_code, 400)
            self.assertIn("lịch thuê", context.exception.detail)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
