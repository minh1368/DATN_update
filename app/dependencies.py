from fastapi import Depends, Header, HTTPException, status
from app.database import SessionLocal
from app.security import verify_access_token


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_authenticated_user(authorization: str | None = Header(None, alias="Authorization")):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token"
        )

    payload = verify_access_token(authorization.split(" ", 1)[1].strip())
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    role = payload.get("role")
    if role not in ("admin", "staff", "customer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user role"
        )

    return {
        "role": role,
        "user_id": payload.get("user_id"),
        "email": payload.get("email") or payload.get("username"),
    }


def get_optional_authenticated_user(authorization: str | None = Header(None, alias="Authorization")):
    if not authorization:
        return None
    return get_authenticated_user(authorization)


def get_current_user(user: dict = Depends(get_authenticated_user)):
    if user["role"] not in ("admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )
    return user


def require_customer_access(customer_id: int, user: dict = Depends(get_authenticated_user)):
    if user["role"] == "customer" and int(user.get("user_id") or 0) != customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập dữ liệu khách hàng này"
        )
    return user


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


def require_staff_or_admin(user: dict = Depends(get_current_user)):
    return user
