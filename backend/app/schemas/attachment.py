from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Shared properties
class AttachmentBase(BaseModel):
    filename: str
    description: Optional[str] = None
    file_type: str
    file_size: int

    class Config:
        from_attributes = True


# Properties to receive via API on creation
class AttachmentCreate(AttachmentBase):
    thesis_id: str
    uploaded_by: str


# Properties to receive via API on update
class AttachmentUpdate(BaseModel):
    filename: Optional[str] = None
    description: Optional[str] = None


# Properties shared by models stored in DB
class AttachmentInDBBase(AttachmentBase):
    id: str
    file_path: str
    thesis_id: str
    uploaded_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Properties to return to client
class Attachment(AttachmentInDBBase):
    pass


# Additional properties for attachment detail view
class AttachmentDetail(Attachment):
    uploader: "UserSimple"


from app.schemas.thesis import UserSimple

# Update forward references
AttachmentDetail.update_forward_refs() 