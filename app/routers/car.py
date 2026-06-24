from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.dependencies import get_db, require_staff_or_admin, require_admin
from app.models.car import Car
from app.models.contract import Contract
from app.models.rental_request import RentalRequest
from app.schemas.car import CarCreate, CarResponse

router = APIRouter(prefix="/cars", tags=["Cars"])

# GET cars
@router.get("/", response_model=List[CarResponse])
def get_cars(db: Session = Depends(get_db)):
    return db.query(Car).all()
# GET ID cars
@router.get("/{car_id}", response_model=CarResponse)
def get_car_detail(car_id: int, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.car_id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car

# POST car
@router.post("/", response_model=CarResponse)
def create_car(car: CarCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    license_plate = car.license_plate.strip()
    if db.query(Car).filter(Car.license_plate == license_plate).first():
        raise HTTPException(status_code=400, detail="Biển số xe đã tồn tại")

    new_car = Car(**car.model_dump())
    new_car.license_plate = license_plate
    db.add(new_car)

    try:
        db.commit()
        db.refresh(new_car)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Biển số xe đã tồn tại"
        )

    return new_car

# PUT car
@router.put("/{car_id}", response_model=CarResponse)
def update_car(car_id: int, car_data: CarCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    car = db.query(Car).filter(Car.car_id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    license_plate = car_data.license_plate.strip()
    duplicate = db.query(Car).filter(
        Car.license_plate == license_plate,
        Car.car_id != car_id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Biển số xe đã tồn tại")

    for field, value in car_data.model_dump().items():
        setattr(car, field, value)
    car.license_plate = license_plate

    try:
        db.commit()
        db.refresh(car)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Biển số xe đã tồn tại")
    return car

# DELETE car
@router.delete("/{car_id}")
def delete_car(car_id: int, db: Session = Depends(get_db), user: dict = Depends(require_admin)):
    car = db.query(Car).filter(Car.car_id == car_id).first()
    
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    if car.status == "rented":
        raise HTTPException(status_code=400, detail="Car is currently rented")

    if db.query(RentalRequest).filter(RentalRequest.car_id == car_id).first():
        raise HTTPException(status_code=400, detail="Không thể xóa xe vì có yêu cầu thuê liên quan")

    if db.query(Contract).filter(Contract.car_id == car_id).first():
        raise HTTPException(status_code=400, detail="Không thể xóa xe vì có hợp đồng liên quan")

    try:
        db.delete(car)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Không thể xóa xe vì dữ liệu tham chiếu còn tồn tại")
    
    return {"message": "Car deleted successfully"}
