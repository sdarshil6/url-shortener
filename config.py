from pydantic_settings import BaseSettings


class Settings(BaseSettings):
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
    ALLOW_INSECURE_HTTP: bool
    CLICK_DEDUPLICATION_WINDOW_SECONDS: int


class Config:
    env_file = ".env"


settings = Settings()
