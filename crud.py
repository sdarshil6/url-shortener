import secrets
from sqlalchemy.orm import Session

import auth
import models
import schemas


def get_user_by_username(db: Session, username: str) -> models.User:
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username,
                          hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


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


def update_db_clicks(db: Session, db_url: schemas.URL) -> models.URL:
    db_url.clicks += 1
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
