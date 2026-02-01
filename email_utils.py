import asyncio
from typing import List, Optional
from dataclasses import dataclass
from enum import Enum

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from config import settings
from logging_config import get_logger

# Module-specific logger
logger = get_logger(__name__)


class EmailStatus(Enum):
    """Status codes for email operations."""
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


@dataclass
class EmailResult:
    """Result of an email send operation."""
    status: EmailStatus
    message: str
    attempts: int = 1


# Configure FastMail
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)


async def send_otp_email(email: str, otp: str) -> EmailResult:
    """
    Sends a one-time password (OTP) to the user's email address.
    
    Args:
        email: Recipient email address
        otp: The OTP code to send
    
    Returns:
        EmailResult with status and details
    """
    logger.info(f"Preparing OTP email", extra={'extra_data': {'email': email}})
    
    html_content = f"""
    <html>
        <body>
            <h2>Your Verification Code</h2>
            <p>Thank you for registering. Please use the following code to verify your account:</p>
            <h3 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">{otp}</h3>
            <p>This code will expire in 10 minutes.</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Your NilUrl Account Verification Code",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    
    try:
        await fm.send_message(message)
        logger.info(f"OTP email sent successfully", extra={'extra_data': {'email': email}})
        return EmailResult(status=EmailStatus.SUCCESS, message=f"Email sent successfully to {email}")
    except Exception as e:
        logger.error(
            f"Failed to send OTP email",
            extra={'extra_data': {'email': email, 'error': str(e)}}
        )
        return EmailResult(status=EmailStatus.FAILED, message=f"Failed: {str(e)}")


async def send_password_reset_email(email: str, reset_link: str) -> EmailResult:
    """
    Sends a password reset link to the user's email address.
    
    Args:
        email: Recipient email address
        reset_link: The password reset link
    
    Returns:
        EmailResult with status and details
    """
    logger.info(f"Preparing password reset email", extra={'extra_data': {'email': email}})
    
    html_content = f"""
    <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your NilUrl account. Please click the link below to set a new password:</p>
            <p><a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Your Password</a></p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Your NilUrl Password Reset Link",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)

    try:
        await fm.send_message(message)
        logger.info(f"Password reset email sent successfully", extra={'extra_data': {'email': email}})
        return EmailResult(status=EmailStatus.SUCCESS, message=f"Email sent successfully to {email}")
    except Exception as e:
        logger.error(
            f"Failed to send password reset email",
            extra={'extra_data': {'email': email, 'error': str(e)}}
        )
        return EmailResult(status=EmailStatus.FAILED, message=f"Failed: {str(e)}")
