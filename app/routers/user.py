from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, require_admin, require_staff_or_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserRegister, UserResponse
from app.security import verify_password

router = APIRouter(prefix="/users", tags=["Users"])


def normalize_username(username: str) -> str:
    return username.strip().lower()


def user_response(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        name=user.name,
        username=user.username,
        role=user.role,
        password=user.password or "",
    )


def ensure_unique_username(db: Session, username: str):
    if db.query(User).filter(User.username.ilike(username)).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")


def ensure_unique_username_for_update(db: Session, username: str, user_id: int):
    existing = db.query(User).filter(User.username.ilike(username), User.user_id != user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")


@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    users = db.query(User).filter(User.role != "customer").order_by(User.user_id).all()
    return [user_response(account) for account in users]


@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    data = user.model_dump()
    data["username"] = normalize_username(data["username"])
    data["name"] = (data.get("name") or "").strip() or None
    ensure_unique_username(db, data["username"])
    new_user = User(**data)
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    return user_response(new_user)


@router.post("/register", response_model=UserResponse)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    username = normalize_username(user.username)
    ensure_unique_username(db, username)
    new_user = User(username=username, password=user.password, role="customer")
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    return user_response(new_user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    existing_user = db.query(User).filter(User.user_id == user_id).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    username = normalize_username(user.username)
    ensure_unique_username_for_update(db, username, user_id)

    existing_user.name = (user.name or "").strip() or None
    existing_user.username = username
    if user.password:
        existing_user.password = user.password
    existing_user.role = user.role

    try:
        db.commit()
        db.refresh(existing_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email da duoc su dung")

    return user_response(existing_user)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    existing_user = db.query(User).filter(User.user_id == user_id).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    db.delete(existing_user)
    db.commit()
    return {"message": "Xoa thanh cong"}


@router.post("/login", response_model=UserResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    username = normalize_username(credentials.username)
    user = db.query(User).filter(User.username.ilike(username)).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Tài khoản hoặc mật khẩu sai")

    return user_response(user)
