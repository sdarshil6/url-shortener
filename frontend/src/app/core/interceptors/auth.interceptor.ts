import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, retry, timer, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

// Configuration for retry logic
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelayMs: 1000,
  retryableStatuses: [503, 504], // Service Unavailable, Gateway Timeout
  idempotentMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']
};

/**
 * Determine if a request is safe to retry
 */
function isRetryable(req: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
  // Only retry idempotent methods
  if (!RETRY_CONFIG.idempotentMethods.includes(req.method.toUpperCase())) {
    return false;
  }
  
  // Retry on specific status codes
  if (RETRY_CONFIG.retryableStatuses.includes(error.status)) {
    return true;
  }
  
  // Retry on network errors (status 0)
  if (error.status === 0) {
    return true;
  }
  
  return false;
}

/**
 * Log errors for debugging purposes
 */
function logError(error: HttpErrorResponse, req: HttpRequest<unknown>): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    status: error.status,
    statusText: error.statusText,
    message: error.message,
    errorType: error.status === 0 ? 'NetworkError' : 'HttpError'
  };
  
  // Log to console in development
  console.error('[HTTP Error]', errorLog);
}

/**
 * Get user-friendly error message based on error type
 */
function getUserFriendlyMessage(error: HttpErrorResponse): string {
  // Network errors (no connection, timeout, etc.)
  if (error.status === 0) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  // Server errors
  switch (error.status) {
    case 500:
      return 'An unexpected server error occurred. Please try again later.';
    case 501:
      return 'This feature is not available at the moment.';
    case 502:
      return 'Server is temporarily unavailable. Please try again in a moment.';
    case 503:
      return 'Service is temporarily unavailable due to maintenance. Please try again later.';
    case 504:
      return 'The request timed out. Please try again.';
    case 408:
      return 'The request timed out. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 400:
      // Try to extract specific message from response
      if (error.error?.detail) {
        return error.error.detail;
      }
      return 'Invalid request. Please check your input and try again.';
    default:
      if (error.status >= 500) {
        return 'A server error occurred. Please try again later.';
      }
      if (error.error?.detail) {
        return error.error.detail;
      }
      return 'An unexpected error occurred. Please try again.';
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = authService.getToken();
  
  let clonedReq = req;
  if (token && !req.url.includes('/token')) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(clonedReq).pipe(
    // Retry logic for transient failures
    retry({
      count: RETRY_CONFIG.maxRetries,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (!isRetryable(req, error)) {
          throw error;
        }
        
        console.log(`[Retry] Attempt ${retryCount} for ${req.method} ${req.url}`);
        
        // Exponential backoff
        const delay = RETRY_CONFIG.retryDelayMs * Math.pow(2, retryCount - 1);
        return timer(delay);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Log the error for debugging
      logError(error, req);
      
      // Handle specific status codes
      if (error.status === 401) {
        // Token expired or invalid
        authService.logout();
        router.navigate(['/auth/login']);
        toastService.error('Your session has expired. Please log in again.');
      } else if (error.status === 429) {
        toastService.error('Too many requests. Please wait a moment and try again.');
      } else if (error.status === 0) {
        // Network error
        toastService.error('Unable to connect to the server. Please check your internet connection.');
      } else if (error.status >= 500) {
        // Server errors - show user-friendly message
        toastService.error(getUserFriendlyMessage(error));
      } else if (error.status === 403) {
        toastService.error('You do not have permission to perform this action.');
      }
      // For 400-level errors (except 401, 403, 429), let components handle specific messages
      
      // Attach user-friendly message to error for component usage
      const enhancedError = {
        ...error,
        userMessage: getUserFriendlyMessage(error)
      };
      
      return throwError(() => enhancedError);
    })
  );
};
