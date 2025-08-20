from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.committee import CommitteeMemberRole


# Shared properties
class CommitteeMemberBase(BaseModel):
    role: CommitteeMemberRole
    has_approved: bool = False
    approval_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# Simple representation for nested views
class CommitteeMemberSimple(CommitteeMemberBase):
    id: str
    user_id: str
    user: Optional["UserSimple"] = None

    class Config:
        from_attributes = True


# Properties to receive via API on creation
class CommitteeMemberCreate(CommitteeMemberBase):
    thesis_id: str
    user_id: str


# Properties to receive via API on update
class CommitteeMemberUpdate(BaseModel):
    role: Optional[CommitteeMemberRole] = None
    has_approved: Optional[bool] = None
    approval_date: Optional[datetime] = None


# Properties shared by models stored in DB
class CommitteeMemberInDBBase(CommitteeMemberBase):
    id: str
    thesis_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Properties to return to client
class CommitteeMember(CommitteeMemberInDBBase):
    pass


# Additional properties for detail view
class CommitteeMemberDetail(CommitteeMember):
    user: "UserSimple"
    thesis: "ThesisSimple"


# Simple thesis representation for committee views
class ThesisSimple(BaseModel):
    id: str
    title: str
    status: str

    class Config:
        from_attributes = True


from app.schemas.thesis import UserSimple

# Update forward references
CommitteeMemberSimple.update_forward_refs()
CommitteeMemberDetail.update_forward_refs() 