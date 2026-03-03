from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class PricingPlan(Base):
    """Base pricing plans with feature flags."""
    __tablename__ = "pricing_plans"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Limits
    links_limit = Column(Integer, default=0)
    qr_codes_limit = Column(Integer, default=0)
    custom_links_limit = Column(Integer, default=0)
    
    # Feature flags (boolean capabilities)
    has_basic_analytics = Column(Boolean, default=True)
    has_advanced_analytics = Column(Boolean, default=False)
    has_detailed_geo = Column(Boolean, default=False)
    has_device_tracking = Column(Boolean, default=False)
    has_link_editing = Column(Boolean, default=False)
    has_link_expiration = Column(Boolean, default=False)
    has_custom_integrations = Column(Boolean, default=False)
    has_sla_guarantee = Column(Boolean, default=False)
    has_account_manager = Column(Boolean, default=False)
    
    # Support level: basic, priority, dedicated
    support_level = Column(String, default="basic")
    
    is_popular = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    country_rates = relationship("PricingCountryRate", back_populates="plan", cascade="all, delete-orphan")


class PricingCountryRate(Base):
    """Country-specific pricing for each plan."""
    __tablename__ = "pricing_country_rates"

    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("pricing_plans.id"), nullable=False)
    country_code = Column(String(2), nullable=False, index=True)
    currency = Column(String(3), nullable=False)
    price_monthly = Column(Float, default=0)
    price_yearly = Column(Float, default=0)
    
    plan = relationship("PricingPlan", back_populates="country_rates")
    
    __table_args__ = (
        # Ensure one rate per plan per country
        {'sqlite_autoincrement': True},
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    auth_provider = Column(String, default='email')
    otp = Column(String, nullable=True, default=None)
    otp_expires_at = Column(DateTime, nullable=True, default=None)
    reset_token = Column(String, nullable=True, default=None, index=True)
    reset_token_expires_at = Column(DateTime, nullable=True, default=None)
    
    # Security fields
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True, default=None)

    plan_name = Column(String, default='starter')
    razorpay_subscription_id = Column(String, nullable=True, unique=True)
    subscription_status = Column(String, nullable=True)
    current_period_end = Column(DateTime, nullable=True)

    urls = relationship("URL", back_populates="owner")


class URL(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True)
    secret_key = Column(String, unique=True, index=True)
    target_url = Column(String, index=True)
    is_active = Column(Boolean, default=True)
    clicks = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="urls")
    clicks_info = relationship("Click", back_populates="url")


class Click(Base):
    __tablename__ = "clicks"

    id = Column(Integer, primary_key=True)
    url_id = Column(Integer, ForeignKey("urls.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, index=True)
    user_agent_raw = Column(String)
    referrer = Column(String, nullable=True)
    country = Column(String, nullable=True)
    region = Column(String, nullable=True)
    city = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    device = Column(String, nullable=True)
    url = relationship("URL", back_populates="clicks_info")
