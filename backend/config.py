import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)


class Settings(BaseSettings):
    DATABASE_URL: str
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    APP_URL: str
    FRONTEND_URL: str
    ALLOW_INSECURE_HTTP: bool
    CLICK_DEDUPLICATION_WINDOW_SECONDS: int
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    RAZORPAY_WEBHOOK_SECRET: str
    RAZORPAY_PRO_PLAN_ID: str
    RAZORPAY_BUSINESS_PLAN_ID: str


settings = Settings()
