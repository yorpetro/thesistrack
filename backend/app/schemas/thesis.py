from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.thesis import ThesisStatus


# Shared properties
class ThesisBase(BaseModel):
    title: str
    abstract: Optional[str] = None
    status: ThesisStatus = ThesisStatus.DRAFT


# Properties to receive via API on creation
class ThesisCreate(ThesisBase):
    student_id: str
    supervisor_id: Optional[str] = None


# Properties to receive via API on update
class ThesisUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    status: Optional[ThesisStatus] = None
    supervisor_id: Optional[str] = None
    defense_date: Optional[datetime] = None


# Properties shared by models stored in DB
class ThesisInDBBase(ThesisBase):
    id: str
    student_id: str
    supervisor_id: Optional[str] = None
    document_path: Optional[str] = None
    document_type: Optional[str] = None
    document_size: Optional[int] = None
    submission_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    defense_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Properties to return to client
class Thesis(ThesisInDBBase):
    pass


# Additional properties for thesis detail view
class ThesisDetail(Thesis):
    student: "UserSimple"
    supervisor: Optional["UserSimple"] = None
    comments: List["CommentBase"] = []
    committee_members: List["CommitteeMemberSimple"] = []
    attachments: List["AttachmentBase"] = []


# Simple user representation for thesis views
class UserSimple(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    profile_picture: Optional[str] = None

    class Config:
        orm_mode = True


from app.schemas.comment import CommentBase
from app.schemas.committee import CommitteeMemberSimple  
from app.schemas.attachment import AttachmentBase

# Update forward references
ThesisDetail.update_forward_refs() 