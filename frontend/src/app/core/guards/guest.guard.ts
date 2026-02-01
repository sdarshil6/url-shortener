import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow access to verify-otp and reset-password even when not authenticated
  const allowedPaths = ['verify-otp', 'reset-password'];
  const currentUrl = state.url;
  
  if (allowedPaths.some(path => currentUrl.includes(path))) {
    return true;
  }

  // Check URL fragment FIRST before checking authentication
  // This allows login component to process OAuth callback tokens
  const fragment = window.location.hash.substring(1);
  if (fragment && (fragment.includes('token=') || fragment.includes('error='))) {
    return true; // Allow component to handle token
  }

  // Allow access to login page if there's a token query param (Google OAuth callback)
  if (currentUrl.includes('token=') || currentUrl.includes('error=')) {
    return true;
  }

  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
