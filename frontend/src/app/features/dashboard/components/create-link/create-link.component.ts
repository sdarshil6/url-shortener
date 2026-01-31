import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  constructor(
    private fb: FormBuilder,
    private linkService: LinkService,
    private toastService: ToastService
  ) {
    this.linkForm = this.fb.group({
      target_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      custom_code: ['', [Validators.pattern(/^[a-zA-Z0-9_-]*$/)]]
    });
  }

  onSubmit() {
    if (this.linkForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const linkData: any = {
        target_url: this.linkForm.value.target_url
      };
      
      if (this.linkForm.value.custom_code) {
        linkData.custom_code = this.linkForm.value.custom_code;
      }
      
      this.linkService.createLink(linkData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Your link has been created.';
          this.toastService.success('Your link has been created.');
          this.linkForm.reset();
          
          // Trigger refresh in parent component (link-list)
          window.dispatchEvent(new Event('linkCreated'));
          
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
    }
  }

  clearForm() {
    this.linkForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }
}
