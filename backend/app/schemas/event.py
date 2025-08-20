from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Shared properties
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    location: Optional[str] = None
    thesis_id: Optional[str] = None

    class Config:
        from_attributes = True


# Properties to receive via API on creation
class EventCreate(EventBase):
    user_id: str


# Properties to receive via API on update
class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    location: Optional[str] = None
    thesis_id: Optional[str] = None


# Properties shared by models stored in DB
class EventInDBBase(EventBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Properties to return to client
class Event(EventInDBBase):
    pass


# Additional properties for event detail view
class EventDetail(Event):
    user: "UserSimple"
    thesis: Optional["ThesisSimple"] = None


from app.schemas.thesis import UserSimple
from app.schemas.committee import ThesisSimple

# Update forward references
EventDetail.update_forward_refs() 