from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import crud
import models
from auth import get_current_user
from database import get_db
from plans import PLAN_PERMISSIONS, PLAN_LIMITS


def get_plan_permission(feature: str):
    """
    A dependency that checks if the current user's plan allows access to a feature.
    """
    def _check_permission(
        current_user: models.User = Depends(get_current_user),
    ):
        user_plan = current_user.plan_name or "starter"
        if not PLAN_PERMISSIONS.get(user_plan, {}).get(feature, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your current plan does not allow access to this feature. Please upgrade your plan."
            )
        return True
    return _check_permission


def check_usage_limit(limit_type: str):
    """
    A dependency that checks if the user has exceeded their monthly usage quota.
    'limit_type' can be 'links', 'qr_codes', or 'custom_links'.
    """
    def _check_limit(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user_plan = current_user.plan_name or "starter"
        limit = PLAN_LIMITS.get(user_plan, {}).get(limit_type, 0)

        # A limit of infinity means no check is needed.
        if limit == float('inf'):
            return True

        # Calculate the start of the current monthly billing cycle
        one_month_ago = datetime.utcnow() - timedelta(days=30)

        # Count the relevant items created in the last 30 days
        if limit_type == "links":
            current_usage = db.query(models.URL).filter(
                models.URL.owner_id == current_user.id,
                models.URL.created_at >= one_month_ago
            ).count()
        elif limit_type == "custom_links":
            current_usage = db.query(models.URL).filter(
                models.URL.owner_id == current_user.id,
                models.URL.created_at >= one_month_ago,
                # A simplification for custom keys
                models.URL.key.not_in(
                    crud.get_db_url_by_key(db, models.URL.key))
            ).count()
        # QR codes are tied to links, so their limit is checked during link creation.
        elif limit_type == "qr_codes":
            current_usage = db.query(models.URL).filter(
                models.URL.owner_id == current_user.id,
                models.URL.created_at >= one_month_ago
            ).count()
        else:
            current_usage = 0

        if current_usage >= limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You have exceeded your monthly limit for '{limit_type}'. Please upgrade your plan."
            )
        return True
    return _check_limit
