from typing import Any, List
from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DB, CurrentActiveUser
from app.models.committee import ThesisCommitteeMember, CommitteeMemberRole
from app.models.thesis import Thesis
from app.models.user import User, UserRole
from app.schemas.committee import (
    CommitteeMember as CommitteeMemberSchema,
    CommitteeMemberCreate,
    CommitteeMemberUpdate,
    CommitteeMemberDetail
)

router = APIRouter()

@router.get("/{thesis_id}/committee", response_model=List[CommitteeMemberDetail])
async def read_thesis_committee(
    thesis_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Retrieve committee members for a specific thesis.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Check permissions (students can only view committee for their own theses)
    if (current_user.role == UserRole.STUDENT and 
        current_user.id != thesis.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to view committee for this thesis",
        )
    
    committee_members = db.query(ThesisCommitteeMember).filter(
        ThesisCommitteeMember.thesis_id == thesis_id
    ).all()
    
    return committee_members

@router.post("/{thesis_id}/committee", response_model=CommitteeMemberSchema)
async def add_committee_member(
    thesis_id: str,
    member_in: CommitteeMemberCreate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Add a committee member to a thesis.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Check permissions (only professors or the supervisor can manage committee)
    if (current_user.role != UserRole.PROFESSOR and 
        current_user.id != thesis.supervisor_id):
        raise HTTPException(
            status_code=403,
            detail="Only professors or the thesis supervisor can manage committee members",
        )
    
    # Check if user exists and is eligible (must be a professor or grad assistant)
    user = db.query(User).filter(User.id == member_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    if user.role not in [UserRole.PROFESSOR, UserRole.GRAD_ASSISTANT]:
        raise HTTPException(
            status_code=400,
            detail="Only professors and graduate assistants can be committee members",
        )
    
    # Check if user is already a committee member for this thesis
    existing_member = db.query(ThesisCommitteeMember).filter(
        ThesisCommitteeMember.thesis_id == thesis_id,
        ThesisCommitteeMember.user_id == member_in.user_id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="This user is already a committee member for this thesis",
        )
    
    # Create new committee member
    member_id = str(uuid.uuid4())
    db_member = ThesisCommitteeMember(
        id=member_id,
        role=member_in.role,
        has_approved=member_in.has_approved,
        approval_date=member_in.approval_date,
        thesis_id=thesis_id,
        user_id=member_in.user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    
    return db_member

@router.put("/committee/{member_id}", response_model=CommitteeMemberSchema)
async def update_committee_member(
    member_id: str,
    member_in: CommitteeMemberUpdate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Update a committee member's information.
    """
    # Get the committee member
    member = db.query(ThesisCommitteeMember).filter(
        ThesisCommitteeMember.id == member_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=404,
            detail="Committee member not found",
        )
    
    # Get the thesis
    thesis = db.query(Thesis).filter(Thesis.id == member.thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Check permissions
    is_supervisor = current_user.id == thesis.supervisor_id
    is_committee_member = current_user.id == member.user_id
    
    # Only the supervisor or the member themselves can update
    if not (is_supervisor or is_committee_member):
        if current_user.role != UserRole.PROFESSOR:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to update this committee member",
            )
    
    # Members can only update their approval status, not their role
    if is_committee_member and not is_supervisor:
        member_data = member_in.dict(exclude_unset=True)
        if "role" in member_data:
            raise HTTPException(
                status_code=403,
                detail="Committee members can only update their approval status",
            )
        
        # If approving, set the approval date
        if member_data.get("has_approved") and not member.has_approved:
            member.approval_date = datetime.utcnow()
    
    # Update committee member
    member_data = member_in.dict(exclude_unset=True)
    for field, value in member_data.items():
        setattr(member, field, value)
    
    member.updated_at = datetime.utcnow()
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return member

@router.delete("/committee/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_committee_member(
    member_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> None:
    """
    Remove a committee member from a thesis.
    """
    # Get the committee member
    member = db.query(ThesisCommitteeMember).filter(
        ThesisCommitteeMember.id == member_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=404,
            detail="Committee member not found",
        )
    
    # Get the thesis
    thesis = db.query(Thesis).filter(Thesis.id == member.thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Check permissions (only supervisors can remove committee members)
    if current_user.id != thesis.supervisor_id:
        if current_user.role != UserRole.PROFESSOR:
            raise HTTPException(
                status_code=403,
                detail="Only the thesis supervisor can remove committee members",
            )
    
    db.delete(member)
    db.commit()
    
    return None 