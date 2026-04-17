from fastapi import FastAPI
from app.database import engine, Base

# import ALL models
from app.models import car, customer, user, rental_request, contract, payment

from app.routers import car as car_router
from app.routers import customer as customer_router
from app.routers import user as user_router
from app.routers import rental_request as rental_request_router
from app.routers import contract as contract_router
from app.routers import payment as payment_router

app = FastAPI()

# tạo bảng
Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"message": "API chạy OK"}

# include router (chỉ 1 lần mỗi cái)
app.include_router(car_router.router)
app.include_router(customer_router.router)
app.include_router(user_router.router)
app.include_router(rental_request_router.router)
app.include_router(contract_router.router)
app.include_router(payment_router.router)