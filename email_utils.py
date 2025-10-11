import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import settings


def send_otp_email(email: str, otp: str):
    """
    Sends a one-time password (OTP) to the user's email address using Python's built-in smtplib.
    """
    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Shortify Account Verification Code"
    message["From"] = f"Shortify <{settings.MAIL_FROM}>"
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

    context = ssl.create_default_context()

    server = None
    try:

        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls(context=context)  # Secure the connection
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.sendmail(settings.MAIL_FROM, email, message.as_string())
        print(f"OTP email sent successfully to {email}")  # For debugging
    except Exception as e:

        print(f"Failed to send email: {e}")
    finally:
        if server:
            server.quit()


def send_password_reset_email(email: str, reset_link: str):
    """
    Sends a password reset link to the user's email address.
    """
    html_content = f"""
    <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your Shortify account. Please click the link below to set a new password:</p>
            <p><a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Your Password</a></p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
        </body>
    </html>
    """

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Shortify Password Reset Link"
    message["From"] = f"Shortify <{settings.MAIL_FROM}>"
    message["To"] = email

    part = MIMEText(html_content, "html")
    message.attach(part)

    context = ssl.create_default_context()
    server = None
    try:
        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls(context=context)
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.sendmail(settings.MAIL_FROM, email, message.as_string())
        print(f"Password reset email sent successfully to {email}")
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
    finally:
        if server:
            server.quit()
