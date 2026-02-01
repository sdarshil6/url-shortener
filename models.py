from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


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
