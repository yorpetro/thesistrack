from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole


# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    bio: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    oauth_provider: Optional[str] = None

    class Config:
        orm_mode = True


# Properties to return to client
class User(UserInDBBase):
    pass


# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str


# OAuth user creation
class UserCreateOAuth(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    oauth_provider: str
    oauth_id: str 