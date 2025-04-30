from typing import Any, List, Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import ValidationError

from app.core.deps import DB, CurrentActiveUser, CurrentUser
from app.models.thesis import Thesis, ThesisStatus
from app.models.user import UserRole, User
from app.schemas.thesis import (
    Thesis as ThesisSchema,
    ThesisCreate,
    ThesisUpdate,
    ThesisDetail
)

router = APIRouter()

@router.get("/", response_model=List[ThesisSchema])
async def read_theses(
    db: DB,
    current_user: CurrentActiveUser,
    skip: int = 0,
    limit: int = 100,
    supervisor_id: Optional[str] = None,
) -> Any:
    """
    Retrieve theses based on user role. Can be filtered by supervisor_id (for admins/assistants).
    """
    # Filter theses based on user role
    query = db.query(Thesis) # Start building the query

    if current_user.role == UserRole.STUDENT:
        # Students can only see their own theses
        theses = query.filter(
            Thesis.student_id == current_user.id
        ).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.PROFESSOR:
        # Professors can see theses they supervise
        theses = query.filter(
            Thesis.supervisor_id == current_user.id
        ).offset(skip).limit(limit).all()
    else:  # Graduation assistant or admin
        # Can see all theses, optionally filtered by supervisor_id
        if supervisor_id is not None:
            query = query.filter(Thesis.supervisor_id == supervisor_id)
        theses = query.offset(skip).limit(limit).all()

    return theses

@router.post("/", response_model=ThesisSchema)
async def create_thesis(
    thesis_in: ThesisCreate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Create new thesis.
    """
    # Verify user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Only students can create theses",
        )
    
    # Validate supervisor_id if provided
    if thesis_in.supervisor_id:
        # Check if supervisor exists and is a professor or grad assistant
        supervisor = db.query(User).filter(User.id == thesis_in.supervisor_id).first()
        if not supervisor:
            raise HTTPException(
                status_code=404,
                detail="Supervisor not found",
            )
        if supervisor.role not in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
            raise HTTPException(
                status_code=400,
                detail="Supervisor must be a professor or graduate assistant",
            )
        # Students can't supervise their own thesis
        if supervisor.id == current_user.id:
            raise HTTPException(
                status_code=400,
                detail="Students cannot supervise their own thesis",
            )
    
    # Create the thesis
    thesis_id = str(uuid.uuid4())
    db_thesis = Thesis(
        id=thesis_id,
        title=thesis_in.title,
        abstract=thesis_in.abstract,
        status=thesis_in.status,
        student_id=current_user.id,  # Set current user as the student
        supervisor_id=thesis_in.supervisor_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(db_thesis)
    db.commit()
    db.refresh(db_thesis)
    
    return db_thesis

@router.get("/{thesis_id}", response_model=ThesisDetail)
async def read_thesis(
    thesis_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Get a specific thesis by ID.
    """
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Check permissions
    if (current_user.role == UserRole.STUDENT and 
        current_user.id != thesis.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this thesis",
        )
    
    return thesis

@router.put("/{thesis_id}", response_model=ThesisSchema)
async def update_thesis(
    thesis_id: str,
    thesis_in: ThesisUpdate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Update a thesis.
    """
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Check permissions (only student who owns the thesis or supervisor can update)
    is_owner = current_user.id == thesis.student_id
    is_supervisor = current_user.id == thesis.supervisor_id
    is_reviewer = current_user.role in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]
    
    if not (is_owner or is_supervisor or is_reviewer):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to update this thesis",
        )
    
    # Students can only update if the thesis is in draft or needs revision
    if (is_owner and not is_supervisor and 
        thesis.status not in [ThesisStatus.DRAFT, ThesisStatus.NEEDS_REVISION]):
        raise HTTPException(
            status_code=403,
            detail="Cannot modify thesis that is not in draft or needs revision status",
        )
    
    # Validate supervisor_id if provided
    if thesis_in.supervisor_id is not None:
        # Ignore if empty string or None
        if thesis_in.supervisor_id == "":
            thesis_in.supervisor_id = None
        # If not None, validate
        elif thesis_in.supervisor_id:
            # Check if supervisor exists and is a professor or grad assistant
            supervisor = db.query(User).filter(User.id == thesis_in.supervisor_id).first()
            if not supervisor:
                raise HTTPException(
                    status_code=404,
                    detail="Supervisor not found",
                )
            if supervisor.role not in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
                raise HTTPException(
                    status_code=400,
                    detail="Supervisor must be a professor or graduate assistant",
                )
            # Students can't supervise their own thesis
            if supervisor.id == thesis.student_id:
                raise HTTPException(
                    status_code=400,
                    detail="Students cannot supervise their own thesis",
                )
    
    # Handle status transitions
    if thesis_in.status:
        # Students can only change status from draft to submitted
        if is_owner and not is_reviewer:
            if thesis.status == ThesisStatus.DRAFT and thesis_in.status == ThesisStatus.SUBMITTED:
                thesis.submission_date = datetime.utcnow()
            elif thesis_in.status != thesis.status:
                raise HTTPException(
                    status_code=403,
                    detail="Students can only change status from draft to submitted",
                )
                
        # Update approval date if status is changed to approved
        if thesis_in.status == ThesisStatus.APPROVED and thesis.status != ThesisStatus.APPROVED:
            thesis.approval_date = datetime.utcnow()
    
    # Update thesis attributes
    thesis_data = thesis_in.dict(exclude_unset=True)
    for field, value in thesis_data.items():
        setattr(thesis, field, value)
    
    thesis.updated_at = datetime.utcnow()
    
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    return thesis

@router.delete("/{thesis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thesis(
    thesis_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> None:
    """
    Delete a thesis.
    """
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Only the student who owns the thesis can delete it, and only if it's in draft status
    if current_user.id != thesis.student_id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this thesis",
        )
    
    if thesis.status != ThesisStatus.DRAFT:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete thesis that is not in draft status",
        )
    
    db.delete(thesis)
    db.commit()
    
    return None 