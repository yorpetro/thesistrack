from typing import Any, List
from datetime import datetime, timedelta, timezone

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


@router.post("/", response_model=List[DeadlineSchema])
async def create_deadline(
    deadline_in: DeadlineCreate,
    db: DB,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Create defense deadline and automatically generate submission and review deadlines.
    Only professors can create deadlines.
    
    Business Logic:
    - Defense deadline: User-specified date
    - Submission deadline: 1 week before defense
    - Review deadline: 2 days before defense
    """
    # Check permissions
    if current_user.role not in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
        raise HTTPException(
            status_code=403,
            detail="Only professors and graduation assistants can create deadlines",
        )
    
    # Convert deadline_date to timezone-aware datetime if needed
    defense_date = deadline_in.deadline_date
    if defense_date.tzinfo is None:
        defense_date = defense_date.replace(tzinfo=timezone.utc)
    
    # Get current time as timezone-aware
    now = datetime.now(timezone.utc)
    
    # Validate defense deadline is in the future
    if defense_date <= now:
        raise HTTPException(
            status_code=400,
            detail="Defense deadline must be in the future",
        )
    
    # Calculate related deadlines
    submission_date = defense_date - timedelta(weeks=1)  # 1 week before defense
    review_date = defense_date - timedelta(days=2)       # 2 days before defense
    
    # Validate that submission deadline is in the future
    if submission_date <= now:
        raise HTTPException(
            status_code=400,
            detail="Defense deadline is too soon. Submission deadline (1 week before) must be in the future.",
        )
    
    created_deadlines = []
    
    try:
        # Create defense deadline
        defense_deadline = Deadline(
            title=deadline_in.title,
            description=deadline_in.description,
            deadline_date=defense_date,
            deadline_type=DeadlineType.DEFENSE,
            is_active=deadline_in.is_active,
            is_global=deadline_in.is_global,
        )
        db.add(defense_deadline)
        
        # Create submission deadline (1 week before defense)
        submission_deadline = Deadline(
            title=f"Thesis Submission - {deadline_in.title}",
            description=f"Student thesis submission deadline (1 week before defense: {deadline_in.title})",
            deadline_date=submission_date,
            deadline_type=DeadlineType.SUBMISSION,
            is_active=deadline_in.is_active,
            is_global=deadline_in.is_global,
        )
        db.add(submission_deadline)
        
        # Create review deadline (2 days before defense)  
        review_deadline = Deadline(
            title=f"Review Completion - {deadline_in.title}",
            description=f"Assistant review completion deadline (2 days before defense: {deadline_in.title})",
            deadline_date=review_date,
            deadline_type=DeadlineType.REVIEW,
            is_active=deadline_in.is_active,
            is_global=deadline_in.is_global,
        )
        db.add(review_deadline)
        
        # Commit all deadlines
        db.commit()
        
        # Refresh all objects
        db.refresh(defense_deadline)
        db.refresh(submission_deadline) 
        db.refresh(review_deadline)
        
        created_deadlines = [defense_deadline, submission_deadline, review_deadline]
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create deadlines: {str(e)}",
        )
    
    return created_deadlines


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
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=days_ahead)
    
    query = db.query(Deadline).filter(
        Deadline.deadline_date >= now,
        Deadline.deadline_date <= end_date,
        Deadline.is_active == True
    )
    
    # Role-based filtering
    if current_user.role == UserRole.STUDENT:
        # Students see submission and defense deadlines (global only)
        query = query.filter(
            Deadline.is_global == True,
            Deadline.deadline_type.in_(['submission', 'defense'])
        )
    elif current_user.role in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
        # Professors and assistants see all active global deadlines
        query = query.filter(Deadline.is_global == True)
    
    deadlines = query.order_by(Deadline.deadline_date.asc()).all()
    
    # Add computed fields
    result = []
    for deadline in deadlines:
        deadline_detail = DeadlineDetail.from_orm(deadline)
        deadline_detail.is_upcoming = True
        
        # Handle timezone-aware datetime for days_remaining calculation
        if deadline.deadline_date.tzinfo is None:
            deadline_date = deadline.deadline_date.replace(tzinfo=timezone.utc)
        else:
            deadline_date = deadline.deadline_date
            
        delta = deadline_date - now
        deadline_detail.days_remaining = delta.days
        result.append(deadline_detail)
    
    return result 