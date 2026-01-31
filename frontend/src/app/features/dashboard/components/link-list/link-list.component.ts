import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LinkService } from '../../../../core/services/link.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Link, LinkAnalytics } from '../../../../core/models/link.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-link-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent, InputComponent],
  templateUrl: './link-list.component.html',
  styleUrls: ['./link-list.component.scss']
})
export class LinkListComponent implements OnInit, OnDestroy {
  links: Link[] = [];
  loading = false;

  showQRModal = false;
  showEditModal = false;
  showAnalyticsModal = false;

  selectedLink: Link | null = null;
  editForm!: FormGroup;
  editLoading = false;

  analytics: LinkAnalytics | null = null;
  analyticsLoading = false;

  private linkCreatedSubscription?: Subscription;

  constructor(
    private linkService: LinkService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      target_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });
    this.loadLinks();
    
    this.linkCreatedSubscription = this.linkService.linkCreated$.subscribe(() => {
      this.loadLinks();
    });
  }

  ngOnDestroy(): void {
    this.linkCreatedSubscription?.unsubscribe();
  }

  loadLinks(): void {
    this.loading = true;
    this.linkService.getUserLinks().subscribe({
      next: (links) => {
        this.links = links;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error("We couldn't load your links. Please try again.");
        this.cdr.detectChanges();
      }
    });
  }

  refreshLinks(): void {
    this.loadLinks();
    this.toastService.info('Your links have been refreshed.');
  }

  getShortUrl(shortCode: string): string {
    return `${window.location.protocol}//${window.location.host}/${shortCode}`;
  }

  getDisplayUrl(shortCode: string): string {
    return this.getShortUrl(shortCode).replace(/^https?:\/\//, '');
  }

  getExpirationDisplay(expiresAt: string | null): string {
    if (!expiresAt) return 'Never';
    return new Date(expiresAt).toLocaleDateString();
  }

  copyToClipboard(shortCode: string): void {
    const url = this.getShortUrl(shortCode);
    navigator.clipboard.writeText(url);
    this.toastService.success('Link copied to clipboard.');
  }

  openQRModal(link: Link): void {
    this.selectedLink = link;
    setTimeout(() => {
      this.showQRModal = true;
      this.cdr.detectChanges();
    });
  }

  closeQRModal(): void {
    this.showQRModal = false;
    this.selectedLink = null;
  }

  downloadQR(): void {
    if (!this.selectedLink?.qr_code) return;
    
    const link = document.createElement('a');
    link.href = this.selectedLink.qr_code;
    link.download = `qr-code-${this.selectedLink.url}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('QR code downloaded.');
  }

  openEditModal(link: Link): void {
    this.selectedLink = link;
    this.editForm.patchValue({
      target_url: link.target_url
    });
    setTimeout(() => {
      this.showEditModal = true;
      this.cdr.detectChanges();
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedLink = null;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.valid && this.selectedLink) {
      this.editLoading = true;
      this.linkService.updateLink({
        secret_key: this.selectedLink.admin_url,
        target_url: this.editForm.value.target_url
      }).subscribe({
        next: () => {
          this.editLoading = false;
          this.toastService.success('Your link has been updated.');
          this.closeEditModal();
          this.loadLinks();
        },
        error: (error) => {
          this.editLoading = false;
          this.toastService.error("We couldn't update your link. Please try again.");
        }
      });
    }
  }

  openAnalytics(link: Link): void {
    this.selectedLink = link;
    this.analyticsLoading = true;
    setTimeout(() => {
      this.showAnalyticsModal = true;
      this.cdr.detectChanges();
    });

    // Use admin_url (secret_key) for analytics
    this.linkService.getAnalytics(link.admin_url).subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        // Ensure state update happens in next tick to avoid NG0100
        setTimeout(() => {
          this.analyticsLoading = false;
          this.toastService.error("We couldn't load analytics for this link.");
          this.closeAnalyticsModal();
          this.cdr.detectChanges();
        });
      }
    });
  }

  closeAnalyticsModal(): void {
    this.showAnalyticsModal = false;
    this.analytics = null;
    this.selectedLink = null;
  }

  deleteLink(link: Link): void {
    if (confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      this.linkService.deleteLink(link.admin_url).subscribe({
        next: () => {
          this.toastService.success('Link deleted successfully.');
          this.loadLinks();
        },
        error: (error) => {
          this.toastService.error("We couldn't delete the link. Please try again.");
        }
      });
    }
  }

  getAnalyticsArray(obj: { [key: string]: number } | undefined | null): { key: string; value: number }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }
}
