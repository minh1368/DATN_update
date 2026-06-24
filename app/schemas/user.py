from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from datetime import datetime

class UserCreate(BaseModel):
    name: str | None = None
    email: str = Field(validation_alias=AliasChoices("email", "username"))
    password: str = ""
    role: str

    model_config = ConfigDict(populate_by_name=True)

class UserLogin(BaseModel):
    email: str = Field(validation_alias=AliasChoices("email", "username"))
    password: str

    model_config = ConfigDict(populate_by_name=True)

class PasswordResetRequest(BaseModel):
    email: str = Field(validation_alias=AliasChoices("email", "username"))

    model_config = ConfigDict(populate_by_name=True)

class PasswordResetVerify(BaseModel):
    email: str = Field(validation_alias=AliasChoices("email", "username"))
    otp: str

    model_config = ConfigDict(populate_by_name=True)

class PasswordResetConfirm(BaseModel):
    email: str = Field(validation_alias=AliasChoices("email", "username"))
    otp: str
    new_password: str

    model_config = ConfigDict(populate_by_name=True)

class UserResponse(BaseModel):
    user_id: int
    name: str | None = None
    email: str
    password: str
    role: str
    created_at: datetime | None = None
    token: str | None = None

    model_config = ConfigDict(from_attributes=True)
