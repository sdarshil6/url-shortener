import secrets
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

import auth
import models
import schemas


def get_user_by_email(db: Session, email: str) -> models.User:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(
    db: Session,
    user: schemas.UserCreate,
    otp: str = None,
    otp_expires_at: datetime = None,
    is_verified: bool = False
):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        otp=otp,
        otp_expires_at=otp_expires_at,
        is_verified=is_verified
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_user_otp(db: Session, user: models.User):
    user.is_verified = True
    user.otp = None
    user.otp_expires_at = None
    db.commit()
    db.refresh(user)
    return user


def get_db_url_by_key(db: Session, url_key: str) -> models.URL:
    return (
        db.query(models.URL)
        .filter(models.URL.key == url_key, models.URL.is_active)
        .first()
    )


def get_db_url_by_secret_key(db: Session, secret_key: str) -> models.URL:
    return (
        db.query(models.URL)
        .filter(models.URL.secret_key == secret_key, models.URL.is_active)
        .first()
    )


def get_user_urls(db: Session, owner_id: int):
    return db.query(models.URL).filter(models.URL.owner_id == owner_id).all()


def create_db_url(db: Session, url: schemas.URLCreate, owner_id: int) -> models.URL:
    if url.custom_key:
        key = url.custom_key
        if get_db_url_by_key(db, key):
            return None
    else:
        key = secrets.token_urlsafe(5)

    secret_key = secrets.token_urlsafe(8)
    db_url = models.URL(
        target_url=url.target_url,
        key=key,
        secret_key=secret_key,
        owner_id=owner_id,
        expires_at=url.expires_at
    )
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    return db_url


def update_db_clicks(db: Session, db_url: models.URL) -> models.URL:
    db_url.clicks += 1
    new_click = models.Click(url_id=db_url.id)
    db.add(new_click)
    db.commit()
    db.refresh(db_url)
    return db_url


def deactivate_db_url_by_secret_key(db: Session, secret_key: str) -> models.URL:
    db_url = get_db_url_by_secret_key(db, secret_key)
    if db_url:
        db_url.is_active = False
        db.commit()
        db.refresh(db_url)
    return db_url


def update_db_url(db: Session, db_url: models.URL, new_target_url: str) -> models.URL:
    db_url.target_url = new_target_url
    db.commit()
    db.refresh(db_url)
    return db_url


def set_password_reset_token(db: Session, user: models.User, token: str):
    user.reset_token = token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_reset_token(db: Session, token: str) -> models.User:
    return db.query(models.User).filter(models.User.reset_token == token).first()


def update_user_password(db: Session, user: models.User, new_password: str):
    user.hashed_password = auth.get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()
    db.refresh(user)
    return user
