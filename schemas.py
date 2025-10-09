from pydantic import BaseModel
from datetime import datetime


class URLBase(BaseModel):
    target_url: str


class URLCreate(URLBase):
    custom_key: str | None = None
    expires_at: datetime | None = None  # <-- ADD THIS LINE


class URL(URLBase):
    is_active: bool
    clicks: int
    owner_id: int
    expires_at: datetime | None = None  # <-- ADD THIS LINE

    class Config:
        from_attributes = True


class URLInfo(URL):
    url: str
    admin_url: str


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
