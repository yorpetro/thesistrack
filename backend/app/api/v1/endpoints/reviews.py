from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from datetime import datetime

from app import models, schemas
from app.core.deps import get_db, get_current_reviewer
from app.models import User, Thesis, Review

router = APIRouter()


@router.post("/theses/{thesis_id}/reviews", response_model=schemas.ReviewRead, status_code=status.HTTP_201_CREATED)
def create_thesis_review(
    *, 
    db: Session = Depends(get_db),
    thesis_id: str,
    review_in: schemas.ReviewCreate,
    current_user: User = Depends(get_current_reviewer)
) -> Any:
    """
    Create a new review for a specific thesis.

    Accessible by professors and graduation assistants.
    The review title is auto-generated.
    """
    # Check if thesis exists
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found",
        )
    
    # Role check is handled by the get_current_reviewer dependency

    # Check if the current user is the assigned reviewer for this thesis
    if thesis.supervisor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review theses that are assigned to you",
        )

    # Create the Review database object
    db_review = Review(
        comments=review_in.comments,
        grade=review_in.grade,
        thesis_id=thesis_id,
        assistant_id=current_user.id,
        assigned_at=datetime.utcnow()
    )
    
    # Add to session, commit, and refresh
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return db_review

# Add other review endpoints here (GET, PUT, DELETE) if needed 