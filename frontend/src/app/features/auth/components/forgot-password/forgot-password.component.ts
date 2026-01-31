import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { AuthLayoutComponent } from '../../../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, AuthLayoutComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { email } = this.forgotForm.value;
      
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Password reset link has been sent to your email. Please check your inbox.';
          this.toastService.success('Password reset instructions have been sent to your email.');
          this.forgotForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          const message = error.error?.detail || 'Failed to send reset link. Please try again.';
          this.errorMessage = message;
          this.toastService.error(message);
        }
      });
    }
  }
}
