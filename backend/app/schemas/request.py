from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.request import RequestStatus


# Base class for shared properties
class RequestBase(BaseModel):
    student_id: str
    assistant_id: str
    thesis_id: str


# Properties to receive via API on creation
class RequestCreate(RequestBase):
    pass


# Properties to receive via API on update 
class RequestUpdate(BaseModel):
    status: RequestStatus


# Properties shared by models stored in DB
class RequestInDBBase(RequestBase):
    id: str
    status: RequestStatus
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Properties to return to client
class Request(RequestInDBBase):
    pass


# Detailed request with user information
class RequestDetail(Request):
    student_name: Optional[str] = None
    assistant_name: Optional[str] = None
    thesis_title: Optional[str] = None 