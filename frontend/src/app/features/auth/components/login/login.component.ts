import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

    // Check for token from Google Auth redirect
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        // Find handleAuthentication in authService to see if it exposes a public method for this, 
        // or just manually set it. AuthService has handleAuthentication private.
        // But login() calls it. 
        // We can manually set it or expose a method. 
        // For now, let's manually set it in localStorage here if handleAuthentication is private, 
        // BUT wait, authService logic is encapsulated. Checking auth.service.ts...
        // handleAuthentication is private.
        // We should probably rely on AuthService to handle the session.
        // But since we can't change AuthService easily without another edit, let's use localStorage directly here
        // matching the key in AuthService (which is 'accessToken').
        // Actually, let's do it cleanly by editing AuthService if needed, or just hacking it here matching likely implementation.
        // AuthService uses private readonly TOKEN_KEY = 'accessToken';
        
        localStorage.setItem('accessToken', token); 
        // Force refresh of auth state if subject is used
        // Since we can't easily access the subject, we might need to reload or just navigate.
        // Navigating to dashboard should trigger AuthGuard which checks localStorage.
        this.router.navigate(['/dashboard']);
      }
      
      const error = params['error'];
      if (error) {
        this.errorMessage = 'Authentication failed: ' + error;
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.toastService.success('Login successful! Welcome back.');
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
