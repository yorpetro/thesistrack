from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Shared properties
class CommentBase(BaseModel):
    content: str
    is_resolved: bool = False
    parent_id: Optional[str] = None

    class Config:
        from_attributes = True


# Properties to receive via API on creation
class CommentCreate(CommentBase):
    thesis_id: str
    user_id: str


# Properties to receive via API on update
class CommentUpdate(BaseModel):
    content: Optional[str] = None
    is_resolved: Optional[bool] = None


# Properties shared by models stored in DB
class CommentInDBBase(CommentBase):
    id: str
    thesis_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Properties to return to client
class Comment(CommentInDBBase):
    pass


# Additional properties for comment detail view with user info
class CommentDetail(Comment):
    user: "UserSimple"
    replies: List["CommentDetail"] = []


from app.schemas.thesis import UserSimple

# Update forward references
CommentDetail.update_forward_refs() 