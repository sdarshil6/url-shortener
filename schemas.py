from pydantic import BaseModel
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


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

    class Config:
        from_attributes = True
