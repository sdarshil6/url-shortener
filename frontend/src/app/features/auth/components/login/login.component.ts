import { Component, OnInit, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { AuthLayoutComponent } from '../../../../shared/components/auth-layout/auth-layout.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, AuthLayoutComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  appName = environment.appName;
  googleLoginUrl = '';
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.googleLoginUrl = this.authService.getGoogleLoginUrl();

    // Check for token from Google Auth redirect (using URL fragment for security)
    // Only process fragments in browser context (SSR compatibility)
    if (isPlatformBrowser(this.platformId)) {
      const fragment = this.route.snapshot.fragment;
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const token = params.get('token');
        const error = params.get('error');
        
        if (token) {
          this.authService.handleAuthenticationPublic(token);
          this.toastService.success('Welcome! You have been signed in with Google.');
          // Use setTimeout to ensure localStorage write completes before navigation
          // This prevents race condition where auth guard checks before token is stored
          setTimeout(() => {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          }, 0);
        } else if (error) {
          // Handle specific error codes from backend
          let errorMessage = 'Google authentication failed. Please try again.';
          
          switch (error) {
            case 'EMAIL_NOT_VERIFIED':
              errorMessage = 'Please verify your email with Google before signing in.';
              break;
            case 'AUTH_PROVIDER_MISMATCH':
              errorMessage = 'An account with this email already exists. Please sign in with your password.';
              break;
            case 'CSRF_VALIDATION_FAILED':
              errorMessage = 'Security validation failed. Please try signing in again.';
              break;
            case 'GOOGLE_AUTH_FAILED':
              errorMessage = 'Google authentication failed. Please try again.';
              break;
            default:
              errorMessage = `Authentication failed: ${error}`;
          }
          
          this.errorMessage = errorMessage;
          this.toastService.error(errorMessage);
          // Clear error from URL
          this.router.navigate(['/auth/login'], { replaceUrl: true });
        }
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.toastService.success('Welcome back! You are now signed in.');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.detail || 'Login failed. Please try again.';
          this.errorMessage = message;
          this.toastService.error(message);
        }
      });
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
