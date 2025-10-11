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
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="urls")
    clicks_info = relationship("Click", back_populates="url")


class Click(Base):
    __tablename__ = "clicks"

    id = Column(Integer, primary_key=True)
    url_id = Column(Integer, ForeignKey("urls.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    url = relationship("URL", back_populates="clicks_info")
