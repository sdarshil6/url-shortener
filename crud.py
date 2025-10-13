import secrets
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import Counter
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
    is_verified: bool = False,
    auth_provider: str = 'email'
):
    hashed_password = auth.get_password_hash(
        user.password) if user.password else None
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        otp=otp,
        otp_expires_at=otp_expires_at,
        is_verified=is_verified,
        auth_provider=auth_provider
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


def record_click(
    db: Session,
    db_url: models.URL,
    ip_address: str,
    user_agent: str,
    referrer: str,
    geo_data: dict,
    device_data: dict
):

    db_url.clicks += 1

    new_click = models.Click(
        url_id=db_url.id,
        ip_address=ip_address,
        user_agent_raw=user_agent,
        referrer=referrer,
        country=geo_data.get("country"),
        region=geo_data.get("region"),
        city=geo_data.get("city"),
        browser=device_data.get("browser"),
        os=device_data.get("os"),
        device=device_data.get("device"),
    )
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


def get_analytics_for_url(db_url: models.URL) -> schemas.AnalyticsData:
    raw_clicks = db_url.clicks_info

    unique_ips = {click.ip_address for click in raw_clicks}
    unique_clicks = len(unique_ips)

    referrer_counts = Counter(
        click.referrer or "Direct" for click in raw_clicks)
    country_counts = Counter(
        click.country or "Unknown" for click in raw_clicks)
    browser_counts = Counter(
        click.browser or "Unknown" for click in raw_clicks)
    os_counts = Counter(click.os or "Unknown" for click in raw_clicks)

    timeline_counts = Counter(click.timestamp.strftime(
        '%Y-%m-%d') for click in raw_clicks)

    analytics = schemas.AnalyticsData(
        total_clicks=db_url.clicks,
        unique_clicks=unique_clicks,
        top_referrers=[schemas.CountStat(
            item=item, count=count) for item, count in referrer_counts.most_common(5)],
        clicks_by_country=[schemas.CountStat(
            item=item, count=count) for item, count in country_counts.most_common(5)],
        clicks_by_browser=[schemas.CountStat(
            item=item, count=count) for item, count in browser_counts.most_common(5)],
        clicks_by_os=[schemas.CountStat(item=item, count=count)
                      for item, count in os_counts.most_common(5)],
        click_timeline=sorted([schemas.TimelineStat(date=date, count=count)
                              for date, count in timeline_counts.items()], key=lambda x: x.date)
    )
    return analytics
