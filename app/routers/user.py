from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

# GET users
@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), user: dict = Depends(require_admin)):
    return db.query(User).all()

# POST user
@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    new_user = User(**user.dict())
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Username đã tồn tại"
        )

    return new_user

@router.post("/register", response_model=UserResponse)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    new_user = User(username=user.username, password=user.password, role="customer")
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Username đã tồn tại"
        )

    return new_user

@router.post("/login")
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == credentials.username,
        User.password == credentials.password,
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Tài khoản hoặc mật khẩu sai")

    return UserResponse.from_orm(user)