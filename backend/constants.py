"""
Application Constants

This module contains all constant values used throughout the application.
These values are not intended to be changed at runtime and represent
application-wide configuration defaults.
"""

# ============================================================================
# Authentication & Security
# ============================================================================

# Password Requirements
MIN_PASSWORD_LENGTH = 8
REQUIRED_SPECIAL_CHARS = "!@#$%^&*"

# OTP (One-Time Password) Configuration
OTP_EXPIRY_MINUTES = 10
OTP_MIN = 100000
OTP_MAX = 999999

# Password Reset Configuration
PASSWORD_RESET_EXPIRY_MINUTES = 15

# Account Security
MAX_FAILED_LOGIN_ATTEMPTS = 5
ACCOUNT_LOCKOUT_MINUTES = 15

# OAuth Configuration
OAUTH_STATE_EXPIRY_MINUTES = 15

# ============================================================================
# URL Generation
# ============================================================================

# URL Key Generation
URL_KEY_LENGTH = 5
SECRET_KEY_LENGTH = 8
MAX_URL_KEY_GENERATION_RETRIES = 3

# ============================================================================
# QR Code Configuration
# ============================================================================

QR_VERSION = 1
QR_BOX_SIZE = 10
QR_BORDER = 4

# ============================================================================
# Analytics
# ============================================================================

ANALYTICS_TOP_ITEMS_COUNT = 5

# ============================================================================
# Logging Configuration
# ============================================================================

LOG_FILE_MAX_BYTES = 5 * 1024 * 1024  # 5 MB
LOG_BACKUP_COUNT = 10

# ============================================================================
# Background Tasks
# ============================================================================

CACHE_CLEANUP_INTERVAL_SECONDS = 3600  # 1 hour
CACHE_CLEANUP_MULTIPLIER = 10

# ============================================================================
# Subscriptions
# ============================================================================

SUBSCRIPTION_CYCLES_PER_YEAR = 12

# ============================================================================
# App Branding
# ============================================================================

APP_NAME = "NilUrl"

# ============================================================================
# User Agent
# ============================================================================

MAX_USER_AGENT_LENGTH = 1000
MAX_USER_AGENT_LOG_LENGTH = 200
