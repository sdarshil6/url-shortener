/**
 * Application-wide constants
 * 
 * This file contains all constant values used throughout the frontend application.
 * These values are not intended to be changed at runtime and represent
 * application-wide configuration defaults.
 */

/**
 * Toast notification durations in milliseconds
 */
export const TOAST_DURATIONS = {
  success: 3000,
  error: 4000,
  warning: 3500,
  info: 3000,
} as const;

/**
 * API retry configuration
 */
export const API_RETRY = {
  count: 2,
  baseDelay: 1000,  // milliseconds
  maxDelay: 3000,   // milliseconds
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION = {
  defaultItemsPerPage: 20,
  maxVisiblePages: 5,
} as const;

/**
 * Search configuration
 */
export const SEARCH = {
  debounceMs: 400,
} as const;

/**
 * Toast icon paths
 */
export const TOAST_ICONS = {
  success: 'assets/icons/check.svg',
  error: 'assets/icons/x-circle.svg',
  warning: 'assets/icons/alert-triangle.svg',
} as const;

/**
 * HTTP status codes for reference
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
