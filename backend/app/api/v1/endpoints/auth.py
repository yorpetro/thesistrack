from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
import uuid
import httpx
from authlib.jose import jwt

from sqlalchemy.orm import Session

from app.core.deps import DB
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.user import User as UserSchema, UserCreate, GoogleAuthRequest

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register_user(
    user_in: UserCreate,
    db: DB,
) -> Any:
    """
    Register a new user.
    """
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DB,
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
    }


@router.post("/google")
async def google_auth(
    auth_request: GoogleAuthRequest,
    db: DB,
) -> Any:
    """
    Authenticate with Google OAuth token.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    try:
        # Verify the Google token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={auth_request.token}"
            )
            
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )
            
        google_user_info = response.json()
        
        # Verify the audience (client ID)
        if google_user_info.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience"
            )
        
        email = google_user_info.get("email")
        full_name = google_user_info.get("name", email)
        google_id = google_user_info.get("sub")
        
        if not email or not google_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google user info"
            )
        
        # Check if user already exists
        user = db.query(User).filter(
            (User.email == email) | 
            ((User.oauth_provider == "google") & (User.oauth_id == google_id))
        ).first()
        
        is_new_user = user is None
        
        if user:
            # Update existing user's OAuth info if needed
            if not user.oauth_provider:
                user.oauth_provider = "google"
                user.oauth_id = google_id
                user.is_verified = True
                db.commit()
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            user = User(
                id=user_id,
                email=email,
                full_name=full_name,
                role=UserRole.student,  # Default new Google users to student
                oauth_provider="google",
                oauth_id=google_id,
                is_verified=True,
                hashed_password=None,  # No password for OAuth users
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_new_user": is_new_user
        }
        
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify Google token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        ) 