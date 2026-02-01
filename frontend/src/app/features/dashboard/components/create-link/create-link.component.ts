import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LinkService } from '../../../../core/services/link.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-create-link',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './create-link.component.html',
  styleUrl: './create-link.component.scss'
})
export class CreateLinkComponent {
  linkForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  minDate: string;
  showAllErrors = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private linkService: LinkService,
    private toastService: ToastService
  ) {
    // Set minimum date to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.minDate = now.toISOString().slice(0, 16);

    this.linkForm = this.fb.group({
      target_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      custom_code: ['', [Validators.pattern(/^[a-zA-Z0-9_-]*$/)]],
      expires_at: ['', [this.futureDateValidator]]
    });
  }

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const now = new Date();
    return selectedDate > now ? null : { pastDate: true };
  }

  onSubmit() {
    if (this.linkForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.showAllErrors = false;
      
      const linkData: any = {
        target_url: this.linkForm.value.target_url
      };
      
      if (this.linkForm.value.custom_code) {
        linkData.custom_key = this.linkForm.value.custom_code;
      }
      
      if (this.linkForm.value.expires_at) {
        linkData.expires_at = new Date(this.linkForm.value.expires_at).toISOString();
      }
      
      this.linkService.createLink(linkData).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Your link has been created.';
          this.toastService.success('Your link has been created.');
          this.linkForm.reset();
          
          // Notify link-list to refresh via service
          this.linkService.notifyLinkCreated();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          const message = error.error?.detail || 'Failed to create link. Please try again.';
          this.errorMessage = message;
          this.toastService.error(message);
        }
      });
    } else {
      // Mark all fields as touched to show errors
      this.showAllErrors = true;
      Object.keys(this.linkForm.controls).forEach(key => {
        this.linkForm.get(key)?.markAsTouched();
      });
      this.toastService.error('Please fix the errors before submitting.');
    }
  }

  clearForm() {
    this.linkForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }
}
