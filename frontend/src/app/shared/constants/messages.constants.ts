/**
 * User-facing messages constants
 * 
 * This file contains all user-facing messages used throughout the application.
 * Centralizing messages makes it easier to maintain consistency, update copy,
 * and potentially support internationalization (i18n) in the future.
 */

/**
 * Authentication-related messages
 */
export const AUTH_MESSAGES = {
  // Success messages
  GOOGLE_LOGIN_SUCCESS: 'Welcome! You have been signed in with Google.',
  LOGIN_SUCCESS: 'Welcome! You are now signed in.',
  REGISTRATION_SUCCESS: 'Account created. Please check your email to verify.',
  VERIFICATION_SUCCESS: 'Your email has been verified.',
  PASSWORD_RESET_SUCCESS: 'Your password has been reset successfully.',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset instructions have been sent to your email.',
  
  // Error messages
  LOGIN_FAILED: 'Login failed. Please try again.',
  GOOGLE_AUTH_FAILED: 'Google authentication failed. Please try again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email with Google before signing in.',
  AUTH_PROVIDER_MISMATCH: 'An account with this email already exists. Please sign in with your password.',
  CSRF_VALIDATION_FAILED: 'Security validation failed. Please try signing in again.',
  AUTHENTICATION_FAILED: (error: string) => `Authentication failed: ${error}`,
} as const;

/**
 * Link management messages
 */
export const LINK_MESSAGES = {
  // Success messages
  LINK_CREATED: 'Your link has been created.',
  LINK_UPDATED: 'Your link has been updated.',
  LINK_DELETED: 'Link deleted successfully.',
  LINK_COPIED: 'Link copied to clipboard.',
  QR_CODE_DOWNLOADED: 'QR code downloaded.',
  
  // Error messages
  LINK_CREATE_FAILED: 'Failed to create link. Please try again.',
  LINK_UPDATE_FAILED: 'Failed to update link. Please try again.',
  LINK_DELETE_FAILED: 'Failed to delete link. Please try again.',
  COPY_FAILED: 'Failed to copy link to clipboard.',
  QR_DOWNLOAD_FAILED: 'Failed to download QR code.',
  LOAD_LINKS_FAILED: 'Failed to load links.',
} as const;

/**
 * Form validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_URL: 'Please enter a valid URL.',
  PASSWORD_TOO_SHORT: (minLength: number) => `Password must be at least ${minLength} characters long.`,
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match.',
  INVALID_OTP: 'Please enter a valid OTP code.',
} as const;

/**
 * Generic messages
 */
export const GENERIC_MESSAGES = {
  LOADING: 'Loading...',
  NO_DATA: 'No data available.',
  ERROR_OCCURRED: 'An error occurred. Please try again.',
  SUCCESS: 'Operation completed successfully.',
  CONFIRM_DELETE: 'Are you sure you want to delete this item?',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

/**
 * API error message mapper
 * Maps common HTTP status codes to user-friendly messages
 */
export const API_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'You are not authorized. Please log in.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The item may already exist.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Please try again later.',
  503: 'Service unavailable. Please try again later.',
} as const;

/**
 * Helper function to get API error message
 */
export function getApiErrorMessage(statusCode: number, defaultMessage?: string): string {
  return API_ERROR_MESSAGES[statusCode] || defaultMessage || GENERIC_MESSAGES.ERROR_OCCURRED;
}
