from typing import Any, List
from datetime import datetime, timedelta
import uuid

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DB, CurrentActiveUser
from app.models.event import Event
from app.models.thesis import Thesis
from app.models.user import UserRole
from app.schemas.event import (
    Event as EventSchema,
    EventCreate,
    EventUpdate,
    EventDetail
)

router = APIRouter()

@router.get("/", response_model=List[EventSchema])
async def read_events(
    current_user: CurrentActiveUser,
    db: DB,
    skip: int = 0,
    limit: int = 100,
    start_date: datetime = None,
    end_date: datetime = None,
) -> Any:
    """
    Retrieve events for the current user.
    """
    # Base query - get user's events
    query = db.query(Event).filter(Event.user_id == current_user.id)
    
    # Filter by date range if provided
    if start_date:
        query = query.filter(Event.end_time >= start_date)
    if end_date:
        query = query.filter(Event.start_time <= end_date)
    
    # Order by start time
    query = query.order_by(Event.start_time)
    
    # Apply pagination
    events = query.offset(skip).limit(limit).all()
    
    return events

@router.post("/", response_model=EventSchema)
async def create_event(
    event_in: EventCreate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Create a new event.
    """
    # If thesis_id is provided, validate it exists and user has permissions
    if event_in.thesis_id:
        thesis = db.query(Thesis).filter(Thesis.id == event_in.thesis_id).first()
        if not thesis:
            raise HTTPException(
                status_code=404,
                detail="Thesis not found",
            )
        
        # Check permissions (students can only create events for their own theses)
        if (current_user.role == UserRole.STUDENT and 
            current_user.id != thesis.student_id):
            raise HTTPException(
                status_code=403,
                detail="Cannot create events for theses you don't own",
            )
    
    # Validate dates
    if event_in.end_time < event_in.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time cannot be before start time",
        )
    
    # Create event
    event_id = str(uuid.uuid4())
    db_event = Event(
        id=event_id,
        title=event_in.title,
        description=event_in.description,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        is_all_day=event_in.is_all_day,
        location=event_in.location,
        thesis_id=event_in.thesis_id,
        user_id=current_user.id,  # Associate with current user
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return db_event

@router.get("/{event_id}", response_model=EventDetail)
async def read_event(
    event_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Get a specific event by ID.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )
    
    # Check permissions (users can only view their own events)
    if event.user_id != current_user.id:
        # Professors can view any thesis-related events
        if current_user.role != UserRole.PROFESSOR:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to access this event",
            )
    
    return event

@router.put("/{event_id}", response_model=EventSchema)
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Update an event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )
    
    # Check permissions (only event owner can update)
    if event.user_id != current_user.id:
        # Professors can update thesis-related events
        if current_user.role != UserRole.PROFESSOR or not event.thesis_id:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to update this event",
            )
    
    # Validate dates if both are provided
    start_time = event_in.start_time or event.start_time
    end_time = event_in.end_time or event.end_time
    
    if end_time < start_time:
        raise HTTPException(
            status_code=400,
            detail="End time cannot be before start time",
        )
    
    # Update event
    event_data = event_in.dict(exclude_unset=True)
    for field, value in event_data.items():
        setattr(event, field, value)
    
    event.updated_at = datetime.utcnow()
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> None:
    """
    Delete an event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )
    
    # Check permissions (only event owner can delete)
    if event.user_id != current_user.id:
        # Professors can delete any thesis-related events
        if current_user.role != UserRole.PROFESSOR or not event.thesis_id:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to delete this event",
            )
    
    db.delete(event)
    db.commit()
    
    return None 