from typing import Any, List

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DB, CurrentUser, CurrentActiveUser
from app.models.user import User
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
    return user 