from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.deadline import DeadlineType


class DeadlineBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    deadline_date: datetime
    deadline_type: DeadlineType
    is_active: bool = True
    is_global: bool = True


class DeadlineCreate(DeadlineBase):
    pass


class DeadlineUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    deadline_date: Optional[datetime] = None
    deadline_type: Optional[DeadlineType] = None
    is_active: Optional[bool] = None
    is_global: Optional[bool] = None


class Deadline(DeadlineBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeadlineDetail(Deadline):
    """Extended deadline information with additional computed fields"""
    is_upcoming: bool = False
    days_remaining: Optional[int] = None
    
    class Config:
        from_attributes = True 