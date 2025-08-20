from typing import Generator, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.db.session import get_db
from app.core.config import settings
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

# Database dependency
DB = Annotated[Session, Depends(get_db)]

async def get_current_user(
    db: DB, token: Annotated[str, Depends(oauth2_scheme)]
) -> User:
    """
    Validate token and return current user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

# User role dependencies
CurrentUser = Annotated[User, Depends(get_current_user)]

async def get_current_active_user(current_user: CurrentUser) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

CurrentActiveUser = Annotated[User, Depends(get_current_active_user)]

async def get_current_student(current_user: CurrentActiveUser) -> User:
    """Get the current student user."""
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_professor(current_user: CurrentActiveUser) -> User:
    """Get the current professor user."""
    if current_user.role != UserRole.professor:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_graduation_assistant(current_user: CurrentActiveUser) -> User:
    """Get the current graduation assistant user."""
    if current_user.role != UserRole.graduation_assistant:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_reviewer(current_user: CurrentActiveUser) -> User:
    """Get the current reviewer user (professor or graduation assistant)."""
    if current_user.role not in [UserRole.professor, UserRole.graduation_assistant]:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user 