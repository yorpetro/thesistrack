from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import select, and_, or_

from app import schemas, models
from app.api import deps
from app.models.request import RequestStatus
from app.models.thesis import ThesisStatus
from datetime import datetime

router = APIRouter()


@router.post("/requests/", response_model=schemas.Request)
async def create_request(
    request_in: schemas.RequestCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new assistant request.
    """
    # Verify the user is a student and the thesis belongs to them
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create assistant requests",
        )
    
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == request_in.thesis_id,
        models.Thesis.student_id == current_user.id
    ).first()
    
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found or does not belong to the current user",
        )
    
    # Check if the thesis is in DRAFT status
    if thesis.status != ThesisStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only request assistance for theses in DRAFT status",
        )
    
    # Check if the assistant exists and is a grad assistant
    assistant = db.query(models.User).filter(
        models.User.id == request_in.assistant_id,
        models.User.role == models.UserRole.GRAD_ASSISTANT
    ).first()
    
    if not assistant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assistant not found or is not a graduation assistant",
        )
    
    # Check if a request to this assistant for this thesis was previously declined
    existing_declined = db.query(models.AssistantRequest).filter(
        models.AssistantRequest.thesis_id == request_in.thesis_id,
        models.AssistantRequest.assistant_id == request_in.assistant_id,
        models.AssistantRequest.status == RequestStatus.DECLINED
    ).first()
    
    if existing_declined:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assistant has already declined to review this thesis",
        )
    
    # Check if there's already a pending request for this thesis to any assistant
    existing_request = db.query(models.AssistantRequest).filter(
        models.AssistantRequest.thesis_id == request_in.thesis_id,
        models.AssistantRequest.status == RequestStatus.REQUESTED
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is already a pending request for this thesis",
        )
    
    # Create new request
    db_request = models.AssistantRequest(
        student_id=current_user.id,
        assistant_id=request_in.assistant_id,
        thesis_id=request_in.thesis_id,
        status=RequestStatus.REQUESTED
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request


@router.put("/requests/{request_id}", response_model=schemas.Request)
async def update_request(
    request_id: str,
    request_update: schemas.RequestUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a request status (accept or decline)
    """
    # Verify the user is a graduation assistant
    if current_user.role != models.UserRole.GRAD_ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only graduation assistants can update request status",
        )
    
    # Get the request
    db_request = db.query(models.AssistantRequest).filter(
        models.AssistantRequest.id == request_id,
        models.AssistantRequest.assistant_id == current_user.id,
        models.AssistantRequest.status == RequestStatus.REQUESTED
    ).first()
    
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or not pending",
        )
    
    # Update request status
    db_request.status = request_update.status
    db_request.resolved_at = datetime.utcnow()
    
    # If accepted, update thesis status to UNDER_REVIEW
    if request_update.status == RequestStatus.ACCEPTED:
        thesis = db.query(models.Thesis).filter(
            models.Thesis.id == db_request.thesis_id
        ).first()
        
        if thesis:
            thesis.status = ThesisStatus.UNDER_REVIEW
    
    db.commit()
    db.refresh(db_request)
    
    return db_request


@router.get("/requests/", response_model=List[schemas.RequestDetail])
async def list_requests(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    status: RequestStatus = None,
) -> Any:
    """
    Retrieve requests (sent by students or received by assistants)
    """
    query = db.query(models.AssistantRequest)
    
    # Filter based on user role
    if current_user.role == models.UserRole.STUDENT:
        query = query.filter(models.AssistantRequest.student_id == current_user.id)
    elif current_user.role == models.UserRole.GRAD_ASSISTANT:
        query = query.filter(models.AssistantRequest.assistant_id == current_user.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and graduation assistants can view requests",
        )
    
    # Apply status filter if provided
    if status:
        query = query.filter(models.AssistantRequest.status == status)
    
    # Order by creation date (newest first)
    query = query.order_by(models.AssistantRequest.created_at.desc())
    
    # Paginate results
    requests = query.offset(skip).limit(limit).all()
    
    # Enrich with names for the detailed view
    result = []
    for req in requests:
        student = db.query(models.User).filter(models.User.id == req.student_id).first()
        assistant = db.query(models.User).filter(models.User.id == req.assistant_id).first()
        thesis = db.query(models.Thesis).filter(models.Thesis.id == req.thesis_id).first()
        
        req_detail = schemas.RequestDetail.from_orm(req)
        req_detail.student_name = student.full_name if student else None
        req_detail.assistant_name = assistant.full_name if assistant else None
        req_detail.thesis_title = thesis.title if thesis else None
        
        result.append(req_detail)
    
    return result


@router.get("/requests/{request_id}", response_model=schemas.RequestDetail)
async def get_request(
    request_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get details for a specific request
    """
    request = db.query(models.AssistantRequest).filter(
        models.AssistantRequest.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )
    
    # Check if user has access to this request
    if (current_user.id != request.student_id and 
        current_user.id != request.assistant_id and
        current_user.role not in [models.UserRole.PROFESSOR]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this request",
        )
    
    # Get additional data for detailed view
    student = db.query(models.User).filter(models.User.id == request.student_id).first()
    assistant = db.query(models.User).filter(models.User.id == request.assistant_id).first()
    thesis = db.query(models.Thesis).filter(models.Thesis.id == request.thesis_id).first()
    
    request_detail = schemas.RequestDetail.from_orm(request)
    request_detail.student_name = student.full_name if student else None
    request_detail.assistant_name = assistant.full_name if assistant else None
    request_detail.thesis_title = thesis.title if thesis else None
    
    return request_detail


@router.delete("/requests/{request_id}", response_model=schemas.Request)
async def cancel_request(
    request_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Cancel a pending assistant request (student only)
    """
    # Verify the user is a student
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can cancel assistant requests",
        )
    
    # Get the request
    db_request = db.query(models.AssistantRequest).filter(
        models.AssistantRequest.id == request_id,
        models.AssistantRequest.student_id == current_user.id,
        models.AssistantRequest.status == RequestStatus.REQUESTED
    ).first()
    
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found, not yours, or not in a pending state",
        )
    
    # Delete the request
    db.delete(db_request)
    db.commit()
    
    return db_request 