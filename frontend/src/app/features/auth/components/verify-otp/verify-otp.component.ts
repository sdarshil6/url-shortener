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
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, InputComponent, AuthLayoutComponent],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss'
})
export class VerifyOtpComponent implements OnInit {
  otpForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  isResending = false;
  email = '';
  username = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.username = params['username'] || '';
      
      if (!this.email || !this.username) {
        this.toastService.warning('Please register first to verify your email.');
        this.router.navigate(['/auth/register']);
      }
    });
  }

  onSubmit() {
    if (this.otpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { otp } = this.otpForm.value;
      
      this.authService.verifyOTP({ 
        username: this.username,
        email: this.email, 
        otp: otp 
      }).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Email verified successfully! Redirecting to login...';
          this.toastService.success('Your email has been verified.');
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          const message = error.error?.detail || 'Invalid OTP. Please try again.';
          this.errorMessage = message;
          this.toastService.error(message);
        }
      });
    }
  }

  resendOTP() {
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Note: You'll need to add a resendOTP method in AuthService if the API supports it
    // For now, this is a placeholder
    setTimeout(() => {
      this.isResending = false;
      this.successMessage = 'OTP has been resent to your email.';
      this.toastService.info('A new verification code has been sent to your email.');
    }, 1000);
  }
}
