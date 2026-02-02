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
import { AUTH_MESSAGES } from '../../../../shared/constants/messages.constants';

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
          this.toastService.success(AUTH_MESSAGES.GOOGLE_LOGIN_SUCCESS);
          // Use setTimeout to ensure localStorage write completes before navigation
          // This prevents race condition where auth guard checks before token is stored
          setTimeout(() => {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          }, 0);
        } else if (error) {
          // Handle specific error codes from backend 
          let errorMessage: string = AUTH_MESSAGES.GOOGLE_AUTH_FAILED;
          
          switch (error) {
            case 'EMAIL_NOT_VERIFIED':
              errorMessage = AUTH_MESSAGES.EMAIL_NOT_VERIFIED;
              break;
            case 'AUTH_PROVIDER_MISMATCH':
              errorMessage = AUTH_MESSAGES.AUTH_PROVIDER_MISMATCH;
              break;
            case 'CSRF_VALIDATION_FAILED':
              errorMessage = AUTH_MESSAGES.CSRF_VALIDATION_FAILED;
              break;
            case 'GOOGLE_AUTH_FAILED':
              errorMessage = AUTH_MESSAGES.GOOGLE_AUTH_FAILED;
              break;
            default:
              errorMessage = AUTH_MESSAGES.AUTHENTICATION_FAILED(error);
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
          this.toastService.success(AUTH_MESSAGES.LOGIN_SUCCESS);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.detail || AUTH_MESSAGES.LOGIN_FAILED;
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
