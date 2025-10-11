

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List


class Click(BaseModel):
    id: int
    url_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class URLBase(BaseModel):
    target_url: str


class URLUpdate(BaseModel):
    target_url: str


class URLCreate(URLBase):
    custom_key: str | None = None
    expires_at: datetime | None = None


class URL(URLBase):
    is_active: bool
    clicks: int
    owner_id: int
    expires_at: datetime | None = None

    class Config:
        from_attributes = True


class URLInfo(URL):
    url: str
    admin_url: str
    qr_code: str | None = None
    clicks_info: List[Click] = []


class OtpVerification(BaseModel):
    email: EmailStr
    otp: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str | None = None


class User(UserBase):
    id: int
    is_verified: bool

    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str
