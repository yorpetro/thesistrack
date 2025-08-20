from typing import Any, List
from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DB, CurrentActiveUser
from app.models.comment import ThesisComment
from app.models.thesis import Thesis, ThesisStatus
from app.models.user import UserRole
from app.schemas.comment import (
    Comment as CommentSchema,
    CommentCreate,
    CommentUpdate,
    CommentDetail
)

router = APIRouter()

@router.get("/{thesis_id}/comments", response_model=List[CommentDetail])
async def read_thesis_comments(
    thesis_id: str,
    current_user: CurrentActiveUser,
    db: DB,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve comments for a specific thesis.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Check permissions (students can only view comments on their own theses)
    if (current_user.role == UserRole.student and 
        current_user.id != thesis.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to view comments on this thesis",
        )
    
    # Get top-level comments (those without a parent)
    comments = db.query(ThesisComment).filter(
        ThesisComment.thesis_id == thesis_id,
        ThesisComment.parent_id == None
    ).offset(skip).limit(limit).all()
    
    return comments

@router.post("/{thesis_id}/comments", response_model=CommentSchema)
async def create_thesis_comment(
    thesis_id: str,
    comment_in: CommentCreate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Create a new comment on a thesis.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=404,
            detail="Thesis not found",
        )
    
    # Check if thesis status allows comments
    if thesis.status == ThesisStatus.draft:
        # Only the owner can comment on drafts
        if current_user.id != thesis.student_id:
            raise HTTPException(
                status_code=403,
                detail="Cannot comment on thesis in draft status",
            )
    
    # Check if parent comment exists if provided
    if comment_in.parent_id:
        parent_comment = db.query(ThesisComment).filter(
            ThesisComment.id == comment_in.parent_id
        ).first()
        if not parent_comment:
            raise HTTPException(
                status_code=404,
                detail="Parent comment not found",
            )
        
        # Parent comment must be for the same thesis
        if parent_comment.thesis_id != thesis_id:
            raise HTTPException(
                status_code=400,
                detail="Parent comment belongs to another thesis",
            )
    
    # Create the comment
    comment_id = str(uuid.uuid4())
    db_comment = ThesisComment(
        id=comment_id,
        content=comment_in.content,
        is_resolved=comment_in.is_resolved,
        parent_id=comment_in.parent_id,
        thesis_id=thesis_id,
        user_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return db_comment

@router.put("/comments/{comment_id}", response_model=CommentSchema)
async def update_comment(
    comment_id: str,
    comment_in: CommentUpdate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Update a comment.
    """
    # Get the comment
    comment = db.query(ThesisComment).filter(ThesisComment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )
    
    # Check permissions (only the comment author can update it)
    if current_user.id != comment.user_id:
        # Professors and grad assistants can mark comments as resolved
        if (current_user.role in [UserRole.professor, UserRole.graduation_assistant] and
            comment_in.dict(exclude_unset=True).keys() == {"is_resolved"}):
            pass
        else:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to update this comment",
            )
    
    # Update the comment
    comment_data = comment_in.dict(exclude_unset=True)
    for field, value in comment_data.items():
        setattr(comment, field, value)
    
    comment.updated_at = datetime.utcnow()
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> None:
    """
    Delete a comment.
    """
    # Get the comment
    comment = db.query(ThesisComment).filter(ThesisComment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )
    
    # Check permissions (only the comment author can delete it)
    if current_user.id != comment.user_id:
        # Professors can delete any comment
        if current_user.role != UserRole.professor:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to delete this comment",
            )
    
    db.delete(comment)
    db.commit()
    
    return None 