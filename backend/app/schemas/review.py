from pydantic import BaseModel, Field
from typing import Optional

# Shared properties
class ReviewBase(BaseModel):
    text: Optional[str] = None
    preliminary_evaluation: Optional[int] = Field(None, ge=2, le=6)


# Properties to receive via API on creation
class ReviewCreate(BaseModel):
    text: str
    preliminary_evaluation: int = Field(..., ge=2, le=6)


# Properties to receive via API on update
class ReviewUpdate(BaseModel):
    text: Optional[str] = None
    preliminary_evaluation: Optional[int] = Field(None, ge=2, le=6)


# Properties shared by models stored in DB
class ReviewInDBBase(ReviewBase):
    id: int
    title: str
    text: str
    preliminary_evaluation: int
    thesis_id: str # Changed to str to match model FK
    assistant_id: str # Changed to str to match model FK

    class Config:
        from_attributes = True


# Properties to return to client
class ReviewRead(ReviewInDBBase):
    pass


# Properties stored in DB
class ReviewInDB(ReviewInDBBase):
    pass 