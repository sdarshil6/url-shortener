import os
from typing import List, Dict
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import Field

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
    
    # CORS Configuration
    CORS_ORIGINS: str = Field(default="http://localhost:4200,http://127.0.0.1:4200")
    
    # Geolocation API Configuration
    GEO_API_URL: str = Field(default="http://ip-api.com")
    GEO_API_ENDPOINT: str = Field(default="/json/{ip}")
    GEO_API_MAX_RETRIES: int = Field(default=2)
    GEO_API_TIMEOUT: float = Field(default=5.0)
    GEO_API_RATE_LIMIT_WAIT: int = Field(default=60)
    GEO_API_RETRY_DELAY: int = Field(default=10)
    GEO_API_FALLBACK_DELAY: int = Field(default=5)
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]


settings = Settings()

# Rate Limits Configuration (can be overridden via environment)
RATE_LIMITS = {
    'register': os.getenv('RATE_LIMIT_REGISTER', '5/hour'),
    'resend_otp': os.getenv('RATE_LIMIT_RESEND_OTP', '5/minute'),
    'login': os.getenv('RATE_LIMIT_LOGIN', '10/minute'),
    'forgot_password': os.getenv('RATE_LIMIT_FORGOT_PASSWORD', '5/hour'),
    'reset_password': os.getenv('RATE_LIMIT_RESET_PASSWORD', '10/minute'),
    'create_url': os.getenv('RATE_LIMIT_CREATE_URL', '30/minute'),
    'update_url': os.getenv('RATE_LIMIT_UPDATE_URL', '20/minute'),
    'delete_url': os.getenv('RATE_LIMIT_DELETE_URL', '20/minute'),
}

# Private IP Prefixes for local IP detection
PRIVATE_IP_PREFIXES = [
    "127.", "192.168.", "10.",
    *[f"172.{i}." for i in range(16, 32)],
    "::1", "localhost", "169.254."
]
