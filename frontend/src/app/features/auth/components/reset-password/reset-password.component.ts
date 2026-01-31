import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { AuthLayoutComponent } from '../../../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, AuthLayoutComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        this.errorMessage = 'Invalid or missing reset token.';
        this.toastService.error('The reset link is invalid or has expired.');
      }
    });
  }

  onSubmit() {
    if (this.resetForm.valid && this.token) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { password } = this.resetForm.value;
      
      this.authService.resetPassword({ token: this.token, new_password: password }).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Password reset successfully! Redirecting to login...';
          this.toastService.success('Your password has been reset successfully.');
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          const message = error.error?.detail || 'Failed to reset password. The link may have expired.';
          this.errorMessage = message;
          this.toastService.error(message);
        }
      });
    }
  }

  get passwordMismatch() {
    return this.resetForm.hasError('passwordMismatch') && 
           this.resetForm.get('confirmPassword')?.touched;
  }
}
