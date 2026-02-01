import smtplib
import ssl
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple
from dataclasses import dataclass
from enum import Enum

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


def _send_email_with_retry(
    email: str,
    message: MIMEMultipart,
    email_type: str,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> EmailResult:
    """
    Send an email with exponential backoff retry logic.
    
    Args:
        email: Recipient email address
        message: The MIMEMultipart message to send
        email_type: Type of email for logging (e.g., 'otp', 'password_reset')
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds for exponential backoff
    
    Returns:
        EmailResult with status and details
    """
    last_error = None
    
    for attempt in range(1, max_retries + 1):
        server = None
        try:
            logger.debug(
                f"Attempting to send {email_type} email",
                extra={'extra_data': {'email': email, 'attempt': attempt, 'max_retries': max_retries}}
            )
            
            context = ssl.create_default_context()
            server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=30)
            server.starttls(context=context)
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, email, message.as_string())
            
            logger.info(
                f"{email_type.replace('_', ' ').title()} email sent successfully",
                extra={'extra_data': {'email': email, 'attempts': attempt}}
            )
            return EmailResult(
                status=EmailStatus.SUCCESS,
                message=f"Email sent successfully to {email}",
                attempts=attempt
            )
            
        except smtplib.SMTPConnectError as e:
            last_error = e
            logger.warning(
                f"SMTP connection error on attempt {attempt}",
                extra={'extra_data': {
                    'email': email,
                    'email_type': email_type,
                    'attempt': attempt,
                    'error': str(e)
                }}
            )
        except smtplib.SMTPAuthenticationError as e:
            # Don't retry on auth errors
            logger.error(
                f"SMTP authentication error - not retrying",
                extra={'extra_data': {
                    'email': email,
                    'email_type': email_type,
                    'error': str(e)
                }}
            )
            return EmailResult(
                status=EmailStatus.FAILED,
                message=f"SMTP authentication failed: {str(e)}",
                attempts=attempt
            )
        except smtplib.SMTPServerDisconnected as e:
            last_error = e
            logger.warning(
                f"SMTP server disconnected on attempt {attempt}",
                extra={'extra_data': {
                    'email': email,
                    'email_type': email_type,
                    'attempt': attempt,
                    'error': str(e)
                }}
            )
        except smtplib.SMTPRecipientsRefused as e:
            # Don't retry on recipient refused
            logger.error(
                f"SMTP recipients refused - not retrying",
                extra={'extra_data': {
                    'email': email,
                    'email_type': email_type,
                    'error': str(e)
                }}
            )
            return EmailResult(
                status=EmailStatus.FAILED,
                message=f"Recipient refused: {str(e)}",
                attempts=attempt
            )
        except smtplib.SMTPException as e:
            last_error = e
            logger.warning(
                f"SMTP error on attempt {attempt}",
                extra={'extra_data': {
                    'email': email,
                    'email_type': email_type,
                    'attempt': attempt,
                    'error_type': type(e).__name__,
                    'error': str(e)
                }}
            )
        except (ConnectionError, TimeoutError, OSError) as e:
            last_error = e
            logger.warning(
                f"Network error on attempt {attempt}",
                extra={'extra_data': {
                    'email': email,
                    'email_type': email_type,
                    'attempt': attempt,
                    'error_type': type(e).__name__,
                    'error': str(e)
                }}
            )
        except Exception as e:
            last_error = e
            logger.error(
                f"Unexpected error sending email",
                extra={'extra_data': {
                    'email': email,
                    'email_type': email_type,
                    'attempt': attempt,
                    'error_type': type(e).__name__,
                    'error': str(e)
                }},
                exc_info=True
            )
        finally:
            if server:
                try:
                    server.quit()
                except Exception:
                    pass
        
        # Exponential backoff before retry
        if attempt < max_retries:
            delay = base_delay * (2 ** (attempt - 1))
            logger.debug(
                f"Waiting {delay}s before retry",
                extra={'extra_data': {'email': email, 'delay': delay}}
            )
            time.sleep(delay)
    
    # All retries exhausted
    logger.error(
        f"Failed to send {email_type} email after {max_retries} attempts",
        extra={'extra_data': {
            'email': email,
            'email_type': email_type,
            'final_error': str(last_error)
        }}
    )
    return EmailResult(
        status=EmailStatus.FAILED,
        message=f"Failed after {max_retries} attempts: {str(last_error)}",
        attempts=max_retries
    )


def send_otp_email(email: str, otp: str) -> EmailResult:
    """
    Sends a one-time password (OTP) to the user's email address.
    
    Args:
        email: Recipient email address
        otp: The OTP code to send
    
    Returns:
        EmailResult with status and details
    """
    logger.info(f"Preparing OTP email", extra={'extra_data': {'email': email}})
    
    message = MIMEMultipart("alternative")
    message["Subject"] = "Your NilUrl Account Verification Code"
    message["From"] = f"NilUrl <{settings.MAIL_FROM}>"
    message["To"] = email

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

    part = MIMEText(html_content, "html")
    message.attach(part)

    return _send_email_with_retry(email, message, "otp")


def send_password_reset_email(email: str, reset_link: str) -> EmailResult:
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

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your NilUrl Password Reset Link"
    message["From"] = f"NilUrl <{settings.MAIL_FROM}>"
    message["To"] = email

    part = MIMEText(html_content, "html")
    message.attach(part)

    return _send_email_with_retry(email, message, "password_reset")
