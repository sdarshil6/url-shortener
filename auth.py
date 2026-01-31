from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi_sso.sso.google import GoogleSSO
from typing import Optional
import crud
import models
import schemas
from database import SessionLocal
from config import settings
from logging_config import get_logger, set_request_context

# Module-specific loggers
logger = get_logger(__name__)
audit_logger = get_logger('audit')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        return result
    except Exception as e:
        logger.error(f"Password verification error", extra={'extra_data': {'error': str(e)}})
        return False


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    email = data.get("sub", "unknown")
    logger.debug(f"Access token created", extra={'extra_data': {'email': email, 'expires_at': expire.isoformat()}})
    return encoded_jwt


google_sso = GoogleSSO(
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    redirect_uri=settings.APP_URL.rstrip("/") + "/auth/google/callback",
    allow_insecure_http=settings.ALLOW_INSECURE_HTTP
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Validate JWT token and return the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY,
                             algorithms=[settings.ALGORITHM])

        email: str = payload.get("sub")
        if email is None:
            audit_logger.warning(
                "Token validation failed: missing email claim",
                extra={'extra_data': {'reason': 'missing_email_claim'}}
            )
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        audit_logger.warning(
            "Token validation failed: invalid JWT",
            extra={'extra_data': {'reason': 'invalid_jwt', 'error': str(e)}}
        )
        raise credentials_exception

    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        audit_logger.warning(
            "Token validation failed: user not found",
            extra={'extra_data': {'email': token_data.email, 'reason': 'user_not_found'}}
        )
        raise credentials_exception
    
    # Set request context for subsequent logging
    set_request_context({'user_id': user.id, 'email': user.email})
    
    return user


def create_password_reset_token(data: dict) -> str:
    """Create a password reset token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire, "type": "reset"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    email = data.get("sub", "unknown")
    audit_logger.info(
        "Password reset token created",
        extra={'extra_data': {'email': email, 'expires_at': expire.isoformat()}}
    )
    return encoded_jwt


def log_auth_event(
    event_type: str,
    success: bool,
    email: str = None,
    ip_address: str = None,
    user_agent: str = None,
    reason: str = None,
    extra_data: dict = None
):
    """Log authentication events for security monitoring."""
    log_data = {
        'event_type': event_type,
        'success': success,
        'email': email,
        'ip_address': ip_address,
        'user_agent': user_agent[:200] if user_agent else None,  # Truncate long user agents
    }
    
    if reason:
        log_data['reason'] = reason
    
    if extra_data:
        log_data.update(extra_data)
    
    if success:
        audit_logger.info(
            f"Auth event: {event_type}",
            extra={'extra_data': log_data}
        )
    else:
        audit_logger.warning(
            f"Auth event failed: {event_type}",
            extra={'extra_data': log_data}
        )
