from pydantic import BaseModel

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

class UserResponse(BaseModel):
    user_id: int
    name: str | None = None
    username: str
    password: str
    role: str

    class Config:
        from_attributes = True
