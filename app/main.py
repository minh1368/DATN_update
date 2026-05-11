from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# import ALL models
from app.models import car, customer, user, rental_request, contract, payment

from app.routers import car as car_router
from app.routers import customer as customer_router
from app.routers import user as user_router
from app.routers import rental_request as rental_request_router
from app.routers import contract as contract_router
from app.routers import payment as payment_router
from app.routers import reports as reports_router

app = FastAPI()

# CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# tạo bảng
Base.metadata.create_all(bind=engine)

# ensure default admin exists
from app.database import SessionLocal
from app.models.user import User

with SessionLocal() as session:
    admin_user = session.query(User).filter(User.username == "admin").first()
    if not admin_user:
        session.add(User(username="admin", password="123456", role="admin"))
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)