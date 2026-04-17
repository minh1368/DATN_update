from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.dependencies import get_db
from app.models.car import Car
from app.schemas import car
from app.schemas.car import CarCreate, CarResponse

router = APIRouter(prefix="/cars", tags=["Cars"])

# GET cars
@router.get("/", response_model=List[CarResponse])
def get_cars(db: Session = Depends(get_db)):
    return db.query(Car).all()

# POST car
@router.post("/", response_model=CarResponse)
def create_car(car: CarCreate, db: Session = Depends(get_db)):
    new_car = Car(**car.dict())
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
# DELETE car
@router.delete("/{car_id}")
def delete_car(car_id: int, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.car_id == car_id).first()
    
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    if car.status == "rented":
        raise HTTPException(status_code=400, detail="Car is currently rented")
    
    db.delete(car)
    db.commit()
    
    return {"message": "Car deleted successfully"}