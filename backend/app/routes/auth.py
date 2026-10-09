import uuid
import logging
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_or_create_guest_user,
    require_authenticated_user,
    normalize_email
)
from app.rate_limiter import rate_limit_register, rate_limit_login

logger = logging.getLogger("aookho.routes.auth")
router = APIRouter()

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: uuid.UUID
    email: str

class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    is_active: bool

@router.post("/register", response_model=TokenResponse)
def register_user(
    req: UserRegisterRequest,
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit_register)
):
    """
    Registers a new user with password hashing and returns an access token.
    Enforces Unicode NFKC email normalization and rate limiting.
    """
    normalized_email = normalize_email(req.email)
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    pw_hash = hash_password(req.password)
    user_id = uuid.uuid4()
    new_user = User(
        id=user_id,
        email=normalized_email,
        password_hash=pw_hash,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email
    )

@router.post("/login", response_model=TokenResponse)
def login_user(
    req: UserLoginRequest,
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit_login)
):
    """
    Authenticates user and returns an access token.
    Enforces Unicode NFKC email normalization and strict rate limiting.
    """
    normalized_email = normalize_email(req.email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated."
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email
    )

@router.post("/guest", response_model=TokenResponse)
def create_guest_session(db: Session = Depends(get_db)):
    """
    Provisions an isolated guest session token for demo and public exploratory testing.
    """
    guest_user = get_or_create_guest_user(db)
    token = create_access_token({"sub": str(guest_user.id), "email": guest_user.email, "role": "guest"})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=guest_user.id,
        email=guest_user.email
    )

@router.get("/me", response_model=UserProfileResponse)
def get_user_profile(current_user: User = Depends(require_authenticated_user)):
    """
    Returns profile for currently authenticated user.
    Strictly requires valid JWT Bearer authentication.
    """
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active
    )
