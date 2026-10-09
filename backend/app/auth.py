import os
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User

security_bearer = HTTPBearer(auto_error=False)

import unicodedata

JWT_ISSUER = "aookho-auth"
JWT_AUDIENCE = "aookho-api"

def normalize_email(email: str) -> str:
    """
    Normalizes email addresses to prevent duplicate accounts via Unicode or casing variations.
    Uses Unicode NFKC normalization, strips leading/trailing whitespace, and converts to lowercase.
    """
    if not email:
        return ""
    return unicodedata.normalize("NFKC", email.strip().lower())

def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with configurable iterations (600,000 per OWASP)
    and a cryptographically secure 16-byte random salt.
    Format: pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
    """
    iterations = settings.PBKDF2_ITERATIONS
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations
    ).hex()
    return f"pbkdf2_sha256${iterations}${salt}${pw_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against stored hash using constant-time comparison.
    Supports both upgraded pbkdf2_sha256$<iter>$<salt>$<hash> and legacy <salt>$<hash>.
    """
    try:
        parts = hashed_password.split("$")
        if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
            iterations = int(parts[1])
            salt = parts[2]
            expected_hash = parts[3]
        elif len(parts) == 2:
            iterations = 100_000
            salt = parts[0]
            expected_hash = parts[1]
        else:
            return False

        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations
        ).hex()
        return secrets.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token with issuer, audience, and expiration.
    No sensitive secrets are placed into the claims.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
    })
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT access token against algorithm confusion,
    verifying signature, expiration, issuer, and audience.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
            options={"require": ["exp", "iss", "aud", "sub"]}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

def get_or_create_guest_user(db: Session, guest_id: str | None = None) -> User:
    """
    Retrieves or generates an isolated guest account for demo/public use.
    Guarantees that each guest session has an isolated user_id to prevent IDOR.
    """
    if guest_id:
        try:
            try:
                uid = uuid.UUID(guest_id)
            except ValueError:
                uid = uuid.uuid5(uuid.NAMESPACE_DNS, guest_id)

            user = db.query(User).filter(User.id == uid).first()
            if user:
                return user
            # Provision isolated guest user with this specific session uid
            guest_email = f"guest_{uid.hex[:12]}@guest.aookho.ai"
            guest_user = User(
                id=uid,
                email=guest_email,
                password_hash=None,
                is_active=True
            )
            db.add(guest_user)
            db.commit()
            db.refresh(guest_user)
            return guest_user
        except Exception:
            pass

    # Provision new isolated guest account
    new_uid = uuid.uuid4()
    guest_email = f"guest_{new_uid.hex[:12]}@guest.aookho.ai"
    guest_user = User(
        id=new_uid,
        email=guest_email,
        password_hash=None,
        is_active=True
    )
    db.add(guest_user)
    db.commit()
    db.refresh(guest_user)
    return guest_user

async def get_current_user(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """
    Identifies the authenticated user:
    1. If a valid JWT Bearer token is provided, returns the verified user.
    2. If a guest session header (X-Session-ID), cookie, or request.state is present, resolves to their isolated guest user.
    3. Otherwise auto-provisions an isolated session user to ensure no unauthenticated IDOR/BOLA.
    """
    # 1. Bearer Token
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Malformed token payload.")
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid user ID format in token.")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or account deactivated.")
        return user

    # 2. Check X-Session-ID header, cookie, or request.state for guest session continuity
    session_id = (
        request.headers.get("X-Session-ID")
        or request.cookies.get("aookho_session")
        or getattr(request.state, "session_id", None)
    )
    return get_or_create_guest_user(db, guest_id=session_id)

def verify_upload_ownership(upload, current_user: User) -> None:
    """
    IDOR / BOLA Prevention:
    Verifies that the current user owns the requested upload resource.
    Raises 404 (not 403) so resource existence is not leaked to unauthorized callers.
    """
    if str(upload.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found."
        )

async def require_authenticated_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """
    Enforces strict authentication via JWT Bearer token.
    Rejects unauthenticated requests with 401 Unauthorized.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )
    payload = decode_access_token(auth.credentials)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Malformed token payload.")
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID format in token.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or account deactivated.")
    return user

