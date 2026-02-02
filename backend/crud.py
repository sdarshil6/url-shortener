import secrets
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError, DataError, SQLAlchemyError
from datetime import datetime, timedelta
from collections import Counter
from typing import Optional, List
import auth
import models
import schemas
from logging_config import get_logger

# Module-specific logger
logger = get_logger(__name__)


class DatabaseError(Exception):
    """Custom exception for database operations."""
    def __init__(self, message: str, operation: str, original_error: Exception = None):
        self.message = message
        self.operation = operation
        self.original_error = original_error
        super().__init__(self.message)


def _handle_db_error(db: Session, operation: str, error: Exception) -> None:
    """Handle database errors with proper rollback and logging."""
    db.rollback()
    
    error_details = {
        "operation": operation,
        "error_type": type(error).__name__,
        "error_message": str(error)
    }
    
    if isinstance(error, IntegrityError):
        logger.error(
            f"Database integrity error during {operation}",
            extra={'extra_data': error_details}
        )
        raise DatabaseError(f"Data integrity violation during {operation}", operation, error)
    elif isinstance(error, OperationalError):
        logger.error(
            f"Database operational error during {operation}",
            extra={'extra_data': error_details}
        )
        raise DatabaseError(f"Database connection/operation error during {operation}", operation, error)
    elif isinstance(error, DataError):
        logger.error(
            f"Database data error during {operation}",
            extra={'extra_data': error_details}
        )
        raise DatabaseError(f"Invalid data format during {operation}", operation, error)
    else:
        logger.error(
            f"Unexpected database error during {operation}",
            extra={'extra_data': error_details},
            exc_info=True
        )
        raise DatabaseError(f"Unexpected error during {operation}", operation, error)


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    operation = "get_user_by_email"
    try:
        logger.debug(f"Fetching user by email", extra={'extra_data': {'email': email}})
        result = db.query(models.User).filter(models.User.email == email).first()
        if result:
            logger.debug(f"User found", extra={'extra_data': {'email': email, 'user_id': result.id}})
        else:
            logger.debug(f"User not found", extra={'extra_data': {'email': email}})
        return result
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def create_user(
    db: Session,
    user: schemas.UserCreate,
    otp: str = None,
    otp_expires_at: datetime = None,
    is_verified: bool = False,
    auth_provider: str = 'email'
) -> models.User:
    operation = "create_user"
    try:
        logger.info(f"Creating new user", extra={'extra_data': {'email': user.email, 'auth_provider': auth_provider}})
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
        logger.info(f"User created successfully", extra={'extra_data': {'email': user.email, 'user_id': db_user.id}})
        return db_user
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def verify_user_otp(db: Session, user: models.User) -> models.User:
    operation = "verify_user_otp"
    try:
        logger.info(f"Verifying user OTP", extra={'extra_data': {'user_id': user.id, 'email': user.email}})
        user.is_verified = True
        user.otp = None
        user.otp_expires_at = None
        db.commit()
        db.refresh(user)
        logger.info(f"User OTP verified successfully", extra={'extra_data': {'user_id': user.id}})
        return user
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def update_user_otp(db: Session, user: models.User, otp: str, otp_expires_at) -> models.User:
    operation = "update_user_otp"
    try:
        logger.debug(f"Updating user OTP", extra={'extra_data': {'user_id': user.id}})
        user.otp = otp
        user.otp_expires_at = otp_expires_at
        db.commit()
        db.refresh(user)
        logger.debug(f"User OTP updated successfully", extra={'extra_data': {'user_id': user.id}})
        return user
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def get_db_url_by_key(db: Session, url_key: str) -> Optional[models.URL]:
    operation = "get_db_url_by_key"
    try:
        logger.debug(f"Fetching URL by key", extra={'extra_data': {'url_key': url_key}})
        result = (
            db.query(models.URL)
            .filter(models.URL.key == url_key, models.URL.is_active)
            .first()
        )
        if result:
            logger.debug(f"URL found", extra={'extra_data': {'url_key': url_key, 'url_id': result.id}})
        return result
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def get_db_url_by_secret_key(db: Session, secret_key: str) -> Optional[models.URL]:
    operation = "get_db_url_by_secret_key"
    try:
        logger.debug(f"Fetching URL by secret key")
        result = (
            db.query(models.URL)
            .filter(models.URL.secret_key == secret_key, models.URL.is_active)
            .first()
        )
        return result
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def get_user_urls(db: Session, owner_id: int) -> List[models.URL]:
    operation = "get_user_urls"
    try:
        logger.debug(f"Fetching URLs for user", extra={'extra_data': {'owner_id': owner_id}})
        result = db.query(models.URL).filter(models.URL.owner_id == owner_id).all()
        logger.debug(f"Found {len(result)} URLs for user", extra={'extra_data': {'owner_id': owner_id, 'count': len(result)}})
        return result
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def get_user_urls_paginated(
    db: Session,
    owner_id: int,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    filter_status: Optional[str] = None
) -> tuple[List[models.URL], int]:
    """Get paginated URLs for a user with optional search, sorting, and filtering."""
    operation = "get_user_urls_paginated"
    try:
        from datetime import datetime, timezone
        logger.debug(f"Fetching paginated URLs for user", extra={'extra_data': {
            'owner_id': owner_id,
            'page': page,
            'limit': limit,
            'search': search,
            'sort_by': sort_by,
            'sort_order': sort_order,
            'filter_status': filter_status
        }})
        
        # Base query
        query = db.query(models.URL).filter(models.URL.owner_id == owner_id)
        
        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (models.URL.target_url.ilike(search_pattern)) |
                (models.URL.key.ilike(search_pattern))
            )
        
        # Apply status filter
        if filter_status == "active":
            query = query.filter(
                models.URL.is_active == True,
                (models.URL.expires_at == None) | (models.URL.expires_at > datetime.now(timezone.utc))
            )
        elif filter_status == "expired":
            query = query.filter(
                (models.URL.is_active == False) |
                ((models.URL.expires_at != None) & (models.URL.expires_at <= datetime.now(timezone.utc)))
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        if sort_by == "clicks":
            order_col = models.URL.clicks
        elif sort_by == "expires_at":
            order_col = models.URL.expires_at
        else:  # default to created_at
            order_col = models.URL.created_at
        
        if sort_order.lower() == "asc":
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())
        
        # Apply pagination
        offset = (page - 1) * limit
        result = query.offset(offset).limit(limit).all()
        
        logger.debug(f"Found {len(result)} URLs (total: {total}) for user", extra={'extra_data': {
            'owner_id': owner_id,
            'count': len(result),
            'total': total,
            'page': page
        }})
        
        return result, total
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def create_db_url(db: Session, url: schemas.URLCreate, owner_id: int) -> Optional[models.URL]:
    operation = "create_db_url"
    try:
        if url.custom_key:
            key = url.custom_key
            if get_db_url_by_key(db, key):
                logger.warning(f"Custom key already in use", extra={'extra_data': {'custom_key': key}})
                return None
            
            # Race condition handling for custom keys
            secret_key = secrets.token_urlsafe(8)
            db_url = models.URL(
                target_url=url.target_url,
                key=key,
                secret_key=secret_key,
                owner_id=owner_id,
                expires_at=url.expires_at
            )
            try:
                db.add(db_url)
                db.commit()
                db.refresh(db_url)
                logger.info(f"URL created successfully", extra={'extra_data': {'url_id': db_url.id, 'key': key}})
                return db_url
            except IntegrityError:
                db.rollback()
                logger.warning(f"Custom key collision detected (race condition)", extra={'extra_data': {'custom_key': key}})
                return None

        else:
            # Random key generation with retries
            max_retries = 3
            for attempt in range(max_retries):
                key = secrets.token_urlsafe(5)
                secret_key = secrets.token_urlsafe(8)
                
                db_url = models.URL(
                    target_url=url.target_url,
                    key=key,
                    secret_key=secret_key,
                    owner_id=owner_id,
                    expires_at=url.expires_at
                )
                try:
                    db.add(db_url)
                    db.commit()
                    db.refresh(db_url)
                    logger.info(f"URL created successfully", extra={'extra_data': {'url_id': db_url.id, 'key': key}})
                    return db_url
                except IntegrityError:
                    db.rollback()
                    logger.warning(f"Key collision detected, retrying", extra={'extra_data': {'key': key, 'attempt': attempt}})
                    continue
            
            logger.error(f"Failed to generate unique key after {max_retries} attempts")
            raise Exception("Failed to generate unique URL key")
            
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def record_click(
    db: Session,
    db_url: models.URL,
    ip_address: str,
    user_agent: str,
    referrer: str,
    geo_data: dict,
    device_data: dict
) -> models.URL:
    operation = "record_click"
    try:
        logger.debug(f"Recording click", extra={'extra_data': {
            'url_id': db_url.id,
            'ip_address': ip_address,
            'country': geo_data.get("country")
        }})

        db.query(models.URL).filter(models.URL.id == db_url.id).update(
            {models.URL.clicks: models.URL.clicks + 1},
            synchronize_session=False
        )

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
        logger.debug(f"Click recorded successfully", extra={'extra_data': {'url_id': db_url.id, 'total_clicks': db_url.clicks}})
        return db_url
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def deactivate_db_url_by_secret_key(db: Session, secret_key: str) -> Optional[models.URL]:
    operation = "deactivate_db_url_by_secret_key"
    try:
        db_url = get_db_url_by_secret_key(db, secret_key)
        if db_url:
            logger.info(f"Deactivating URL", extra={'extra_data': {'url_id': db_url.id}})
            db_url.is_active = False
            db.commit()
            db.refresh(db_url)
            logger.info(f"URL deactivated successfully", extra={'extra_data': {'url_id': db_url.id}})
        return db_url
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def update_db_url(db: Session, db_url: models.URL, new_target_url: str) -> models.URL:
    operation = "update_db_url"
    try:
        logger.info(f"Updating URL target", extra={'extra_data': {'url_id': db_url.id}})
        db_url.target_url = new_target_url
        db.commit()
        db.refresh(db_url)
        logger.info(f"URL updated successfully", extra={'extra_data': {'url_id': db_url.id}})
        return db_url
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def set_password_reset_token(db: Session, user: models.User, token: str) -> models.User:
    operation = "set_password_reset_token"
    try:
        logger.info(f"Setting password reset token", extra={'extra_data': {'user_id': user.id}})
        user.reset_token = token
        user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        db.refresh(user)
        logger.info(f"Password reset token set successfully", extra={'extra_data': {'user_id': user.id}})
        return user
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def get_user_by_reset_token(db: Session, token: str) -> Optional[models.User]:
    operation = "get_user_by_reset_token"
    try:
        logger.debug(f"Fetching user by reset token")
        return db.query(models.User).filter(models.User.reset_token == token).first()
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def update_user_password(db: Session, user: models.User, new_password: str) -> models.User:
    operation = "update_user_password"
    try:
        logger.info(f"Updating user password", extra={'extra_data': {'user_id': user.id}})
        user.hashed_password = auth.get_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expires_at = None
        db.commit()
        db.refresh(user)
        logger.info(f"User password updated successfully", extra={'extra_data': {'user_id': user.id}})
        return user
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def get_analytics_for_url(db_url: models.URL) -> schemas.AnalyticsData:
    """Get analytics for a URL - read-only operation with minimal error handling."""
    logger.debug(f"Generating analytics for URL", extra={'extra_data': {'url_id': db_url.id}})
    
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
    
    logger.debug(f"Analytics generated", extra={'extra_data': {
        'url_id': db_url.id,
        'total_clicks': analytics.total_clicks,
        'unique_clicks': analytics.unique_clicks
    }})
    return analytics


def update_user_subscription_id(db: Session, user_id: int, sub_id: str) -> Optional[models.User]:
    operation = "update_user_subscription_id"
    try:
        logger.info(f"Updating user subscription ID", extra={'extra_data': {'user_id': user_id}})
        user = db.query(models.User).filter(models.User.id == user_id).first()

        if user:
            user.razorpay_subscription_id = sub_id
            db.commit()
            db.refresh(user)
            logger.info(f"User subscription ID updated", extra={'extra_data': {'user_id': user_id}})

        return user
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def get_user_by_subscription_id(db: Session, sub_id: str) -> Optional[models.User]:
    operation = "get_user_by_subscription_id"
    try:
        logger.debug(f"Fetching user by subscription ID")
        return db.query(models.User).filter(models.User.razorpay_subscription_id == sub_id).first()
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)


def update_user_plan_from_webhook(db: Session, user: models.User, plan_name: str, status: str) -> models.User:
    operation = "update_user_plan_from_webhook"
    try:
        logger.info(f"Updating user plan from webhook", extra={'extra_data': {
            'user_id': user.id,
            'plan_name': plan_name,
            'status': status
        }})
        user.plan_name = plan_name
        user.subscription_status = status
        # Set the billing period end to one year from now
        user.current_period_end = datetime.utcnow() + timedelta(days=365)
        db.commit()
        db.refresh(user)
        logger.info(f"User plan updated successfully", extra={'extra_data': {'user_id': user.id, 'plan_name': plan_name}})
        return user
    except SQLAlchemyError as e:
        _handle_db_error(db, operation, e)
