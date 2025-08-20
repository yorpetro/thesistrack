from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.review import ReviewStatus

# Shared properties
class ReviewBase(BaseModel):
    comments: Optional[str] = None
    grade: Optional[float] = Field(None, ge=2.0, le=6.0)
    status: Optional[ReviewStatus] = None


# Properties to receive via API on creation
class ReviewCreate(BaseModel):
    comments: str
    grade: float = Field(..., ge=2.0, le=6.0)


# Properties to receive via API on update
class ReviewUpdate(BaseModel):
    comments: Optional[str] = None
    grade: Optional[float] = Field(None, ge=2.0, le=6.0)
    status: Optional[ReviewStatus] = None


# Properties shared by models stored in DB
class ReviewInDBBase(ReviewBase):
    id: str
    thesis_id: str
    assistant_id: str
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Properties to return to client
class ReviewRead(ReviewInDBBase):
    pass


# Properties stored in DB
class ReviewInDB(ReviewInDBBase):
    pass 