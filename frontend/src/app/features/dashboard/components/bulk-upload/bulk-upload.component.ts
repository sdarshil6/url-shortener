import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { LinkService } from '../../../../core/services/link.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ProgressLoaderComponent } from '../../../../shared/components/progress-loader/progress-loader.component';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ProgressLoaderComponent],
  templateUrl: './bulk-upload.component.html',
  styleUrl: './bulk-upload.component.scss'
})
export class BulkUploadComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  selectedFile: File | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  isDragging: boolean = false;
  
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  readonly ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
  
  constructor(
    private linkService: LinkService,
    private toastService: ToastService
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    // Validate file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      this.toastService.error(
        `Invalid file type. Please upload ${this.ALLOWED_EXTENSIONS.join(', ')} files only.`
      );
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.toastService.error(
        `File size exceeds 10 MB limit. Please upload a smaller file.`
      );
      return;
    }

    this.selectedFile = file;
  }

  uploadFile(): void {
    if (!this.selectedFile || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    this.linkService.uploadBulkLinks(this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          if (event.type === 'progress') {
            this.uploadProgress = event.progress;
          } else if (event.type === 'success') {
            this.handleUploadSuccess(event.data);
          }
        },
        error: (error) => {
          this.handleUploadError(error);
        }
      });
  }

  private handleUploadSuccess(response: any): void {
    this.isUploading = false;
    this.uploadProgress = 100;
    
    const { successful, failed, total, errors } = response;
    
    if (failed === 0) {
      this.toastService.success(
        `Successfully uploaded ${successful} link${successful !== 1 ? 's' : ''}!`
      );
    } else if (successful > 0) {
      this.toastService.warning(
        `Uploaded ${successful} of ${total} links. ${failed} failed validation.`
      );
    } else {
      this.toastService.error(
        `Failed to upload links. Please check the file format.`
      );
    }

    // Reset state
    setTimeout(() => {
      this.selectedFile = null;
      this.uploadProgress = 0;
    }, 2000);

    // Trigger list refresh
    this.linkService.notifyLinkCreated();
  }

  private handleUploadError(error: any): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    
    const errorMessage = error?.error?.detail || error?.message || 'Failed to upload file';
    this.toastService.error(errorMessage);
  }

  cancelUpload(): void {
    if (this.isUploading) {
      this.linkService.cancelBulkUpload();
      this.isUploading = false;
      this.uploadProgress = 0;
      this.toastService.info('Upload cancelled');
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('bulk-file-input') as HTMLInputElement;
    fileInput?.click();
  }

  get fileSize(): string {
    if (!this.selectedFile) return '';
    const sizeInMB = this.selectedFile.size / (1024 * 1024);
    return sizeInMB < 1 
      ? `${(sizeInMB * 1024).toFixed(0)} KB` 
      : `${sizeInMB.toFixed(2)} MB`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.isUploading) {
      this.linkService.cancelBulkUpload();
    }
  }
}
