from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserCreate(BaseModel):
    name: str | None = None
    username: str
    password: str = ""
    role: str

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class PasswordResetRequest(BaseModel):
    username: str

class PasswordResetVerify(BaseModel):
    username: str
    otp: str

class PasswordResetConfirm(BaseModel):
    username: str
    otp: str
    new_password: str

class UserResponse(BaseModel):
    user_id: int
    name: str | None = None
    username: str
    password: str
    role: str
    created_at: datetime | None = None
    token: str | None = None

    model_config = ConfigDict(from_attributes=True)
