import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LinkService } from '../../../../core/services/link.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DateService } from '../../../../shared/services/date.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { LINK_MESSAGES } from '../../../../shared/constants/messages.constants';

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
    private toastService: ToastService,
    private dateService: DateService
  ) {
    // Set minimum date to current date
    this.minDate = this.dateService.getCurrentDateString();

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
        linkData.expires_at = this.dateService.toISOString(this.linkForm.value.expires_at);
      }
      
      this.linkService.createLink(linkData).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = LINK_MESSAGES.LINK_CREATED;
          this.toastService.success(LINK_MESSAGES.LINK_CREATED);
          this.linkForm.reset();
          
          // Notify link-list to refresh via service
          this.linkService.notifyLinkCreated();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          const message = error.error?.detail || LINK_MESSAGES.LINK_CREATE_FAILED;
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
