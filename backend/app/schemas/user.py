from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.user import UserRole


# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    bio: Optional[str] = None
    profile_picture: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# Properties to receive via API on update
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    oauth_provider: Optional[str] = None

    class Config:
        from_attributes = True


# Properties to return to client
class User(UserInDBBase):
    student_count: Optional[int] = None


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


# Google OAuth authentication request
class GoogleAuthRequest(BaseModel):
    token: str 