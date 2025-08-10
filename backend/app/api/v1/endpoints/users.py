from typing import Any, List, Optional
from sqlalchemy import func

from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from pathlib import Path

from app.core.deps import DB, CurrentUser, CurrentActiveUser
from app.core.file_utils import save_profile_picture, validate_image_type, delete_file, UPLOAD_DIR
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
    Update own user profile (name and bio only).
    """
    # Update user attributes
    user_data = user_in.dict(exclude_unset=True)
    
    for field, value in user_data.items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/me/profile-picture", response_model=UserSchema)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: CurrentActiveUser = CurrentActiveUser,
    db: DB = DB,
) -> Any:
    """
    Upload profile picture for current user.
    """
    # Validate file type
    if not validate_image_type(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.",
        )
    
    # Validate file size (max 5MB)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=400,
            detail="File size too large. Maximum size is 5MB.",
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Delete old profile picture if it exists
    if current_user.profile_picture:
        delete_file(current_user.profile_picture)
    
    # Save new profile picture
    try:
        file_path, mimetype, file_size = await save_profile_picture(file, current_user.id)
        
        # Update user profile picture path
        current_user.profile_picture = file_path
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        
        return current_user
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile picture: {str(e)}",
        )

@router.delete("/me/profile-picture", response_model=UserSchema)
async def delete_profile_picture(
    current_user: CurrentActiveUser = CurrentActiveUser,
    db: DB = DB,
) -> Any:
    """
    Delete profile picture for current user.
    """
    if current_user.profile_picture:
        # Delete file from filesystem
        delete_file(current_user.profile_picture)
        
        # Update user profile picture path
        current_user.profile_picture = None
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    
    return current_user

@router.get("/profile-picture/{file_path:path}")
async def serve_profile_picture(file_path: str) -> FileResponse:
    """
    Serve profile picture files.
    """
    # Construct the full file path
    full_path = UPLOAD_DIR / file_path
    
    # Check if file exists
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile picture not found",
        )
    
    # Check if it's in the profiles directory (security check)
    if not str(full_path).startswith(str(UPLOAD_DIR / "profiles")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return FileResponse(
        path=full_path,
        media_type="image/jpeg",  # Will be auto-detected by browser
        headers={"Cache-Control": "public, max-age=3600"}  # Cache for 1 hour
    )

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