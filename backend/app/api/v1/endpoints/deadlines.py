from typing import Any, List
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.core.deps import DB, CurrentActiveUser
from app.models.deadline import Deadline, DeadlineType
from app.models.user import UserRole
from app.schemas.deadline import (
    Deadline as DeadlineSchema,
    DeadlineCreate,
    DeadlineUpdate,
    DeadlineDetail
)

router = APIRouter()


@router.get("/", response_model=List[DeadlineDetail])
async def read_deadlines(
    db: DB,
    current_user: CurrentActiveUser,
    skip: int = 0,
    limit: int = 100,
    deadline_type: DeadlineType = None,
    active_only: bool = True,
) -> Any:
    """
    Retrieve deadlines. Students see all active global deadlines.
    Professors and assistants see all deadlines.
    """
    query = db.query(Deadline)
    
    # Students can only see active global deadlines
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Deadline.is_active == True, Deadline.is_global == True)
    elif active_only:
        query = query.filter(Deadline.is_active == True)
    
    # Filter by deadline type if specified
    if deadline_type:
        query = query.filter(Deadline.deadline_type == deadline_type)
    
    deadlines = query.order_by(Deadline.deadline_date.asc()).offset(skip).limit(limit).all()
    
    # Add computed fields
    now = datetime.utcnow()
    result = []
    for deadline in deadlines:
        deadline_detail = DeadlineDetail.from_orm(deadline)
        deadline_detail.is_upcoming = deadline.deadline_date > now
        if deadline_detail.is_upcoming:
            delta = deadline.deadline_date - now
            deadline_detail.days_remaining = delta.days
        else:
            deadline_detail.days_remaining = None
        result.append(deadline_detail)
    
    return result


@router.post("/", response_model=DeadlineSchema)
async def create_deadline(
    deadline_in: DeadlineCreate,
    db: DB,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Create a new deadline. Only professors can create deadlines.
    """
    # Check permissions
    if current_user.role not in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
        raise HTTPException(
            status_code=403,
            detail="Only professors and graduation assistants can create deadlines",
        )
    
    # Validate deadline is in the future
    if deadline_in.deadline_date <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Deadline must be in the future",
        )
    
    # Create deadline
    deadline = Deadline(**deadline_in.dict())
    db.add(deadline)
    db.commit()
    db.refresh(deadline)
    
    return deadline


@router.get("/{deadline_id}", response_model=DeadlineDetail)
async def read_deadline(
    deadline_id: str,
    db: DB,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Get a specific deadline by ID.
    """
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(
            status_code=404,
            detail="Deadline not found",
        )
    
    # Students can only see active global deadlines
    if (current_user.role == UserRole.STUDENT and 
        (not deadline.is_active or not deadline.is_global)):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this deadline",
        )
    
    # Add computed fields
    now = datetime.utcnow()
    deadline_detail = DeadlineDetail.from_orm(deadline)
    deadline_detail.is_upcoming = deadline.deadline_date > now
    if deadline_detail.is_upcoming:
        delta = deadline.deadline_date - now
        deadline_detail.days_remaining = delta.days
    else:
        deadline_detail.days_remaining = None
    
    return deadline_detail


@router.put("/{deadline_id}", response_model=DeadlineSchema)
async def update_deadline(
    deadline_id: str,
    deadline_in: DeadlineUpdate,
    db: DB,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Update a deadline. Only professors can update deadlines.
    """
    # Check permissions
    if current_user.role not in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
        raise HTTPException(
            status_code=403,
            detail="Only professors and graduation assistants can update deadlines",
        )
    
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(
            status_code=404,
            detail="Deadline not found",
        )
    
    # Validate deadline is in the future if being updated
    if deadline_in.deadline_date and deadline_in.deadline_date <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Deadline must be in the future",
        )
    
    # Update deadline
    deadline_data = deadline_in.dict(exclude_unset=True)
    for field, value in deadline_data.items():
        setattr(deadline, field, value)
    
    deadline.updated_at = datetime.utcnow()
    
    db.add(deadline)
    db.commit()
    db.refresh(deadline)
    
    return deadline


@router.delete("/{deadline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deadline(
    deadline_id: str,
    db: DB,
    current_user: CurrentActiveUser,
) -> None:
    """
    Delete a deadline. Only professors can delete deadlines.
    """
    # Check permissions
    if current_user.role not in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
        raise HTTPException(
            status_code=403,
            detail="Only professors and graduation assistants can delete deadlines",
        )
    
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(
            status_code=404,
            detail="Deadline not found",
        )
    
    db.delete(deadline)
    db.commit()
    
    return None


@router.get("/upcoming/", response_model=List[DeadlineDetail])
async def get_upcoming_deadlines(
    db: DB,
    current_user: CurrentActiveUser,
    days_ahead: int = 30,
) -> Any:
    """
    Get upcoming deadlines within the specified number of days.
    """
    end_date = datetime.utcnow() + timedelta(days=days_ahead)
    
    query = db.query(Deadline).filter(
        Deadline.deadline_date >= datetime.utcnow(),
        Deadline.deadline_date <= end_date,
        Deadline.is_active == True
    )
    
    # Students can only see global deadlines
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Deadline.is_global == True)
    
    deadlines = query.order_by(Deadline.deadline_date.asc()).all()
    
    # Add computed fields
    now = datetime.utcnow()
    result = []
    for deadline in deadlines:
        deadline_detail = DeadlineDetail.from_orm(deadline)
        deadline_detail.is_upcoming = True
        delta = deadline.deadline_date - now
        deadline_detail.days_remaining = delta.days
        result.append(deadline_detail)
    
    return result 