from typing import Any, List, Optional
from sqlalchemy import func

from fastapi import APIRouter, HTTPException, status, Query

from app.core.deps import DB, CurrentUser, CurrentActiveUser
from app.models.user import User, UserRole
from app.models.thesis import Thesis
from app.schemas.user import User as UserSchema, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_current_user(
    current_user: CurrentUser,
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_in: UserUpdate,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Update own user.
    """
    # Check for email uniqueness if trying to change
    if user_in.email and user_in.email != current_user.email:
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )
    
    # Update user attributes
    user_data = user_in.dict(exclude_unset=True)
    
    # Handle password update
    if "password" in user_data:
        from app.core.security import get_password_hash
        user_data["hashed_password"] = get_password_hash(user_data.pop("password"))
    
    for field, value in user_data.items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: str,
    current_user: CurrentActiveUser,
    db: DB,
) -> Any:
    """
    Get a specific user by id.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Add student count for graduation assistants
    if user.role == UserRole.GRAD_ASSISTANT:
        student_count = db.query(func.count(Thesis.id)).filter(
            Thesis.supervisor_id == user.id
        ).scalar()
        user.student_count = student_count
    
    return user

@router.get("/", response_model=List[UserSchema])
async def read_users(
    role: Optional[UserRole] = Query(None, description="Filter users by role"),
    db: DB = DB,
    current_user: CurrentActiveUser = CurrentActiveUser,
) -> Any:
    """
    Get all users with optional role filtering.
    """
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    
    # Add student count for graduation assistants
    for user in users:
        if user.role == UserRole.GRAD_ASSISTANT:
            student_count = db.query(func.count(Thesis.id)).filter(
                Thesis.supervisor_id == user.id
            ).scalar()
            user.student_count = student_count
    
    return users 