import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow access to verify-otp and reset-password even when not authenticated
  const allowedPaths = ['verify-otp', 'reset-password'];
  const currentPath = route.routeConfig?.path || '';
  
  if (allowedPaths.includes(currentPath)) {
    return true;
  }

  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
