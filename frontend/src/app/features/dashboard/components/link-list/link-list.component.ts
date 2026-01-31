import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LinkService } from '../../../../core/services/link.service';
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

  private linkCreatedListener: any;

  constructor(
    private linkService: LinkService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      target_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });
    this.loadLinks();
    
    this.linkCreatedListener = () => this.loadLinks();
    window.addEventListener('linkCreated', this.linkCreatedListener);
  }

  ngOnDestroy(): void {
    if (this.linkCreatedListener) {
      window.removeEventListener('linkCreated', this.linkCreatedListener);
    }
  }

  loadLinks(): void {
    this.loading = true;
    this.linkService.getUserLinks().subscribe({
      next: (links) => {
        this.links = links;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  refreshLinks(): void {
    this.loadLinks();
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
  }

  openQRModal(link: Link): void {
    this.selectedLink = link;
    this.showQRModal = true;
  }

  closeQRModal(): void {
    this.showQRModal = false;
    this.selectedLink = null;
  }

  openEditModal(link: Link): void {
    this.selectedLink = link;
    this.editForm.patchValue({
      target_url: link.target_url
    });
    this.showEditModal = true;
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
          this.closeEditModal();
          this.loadLinks();
        },
        error: () => {
          this.editLoading = false;
        }
      });
    }
  }

  openAnalytics(link: Link): void {
    this.selectedLink = link;
    this.showAnalyticsModal = true;
    this.analyticsLoading = true;

    this.linkService.getAnalytics(link.url).subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
      },
      error: () => {
        this.analyticsLoading = false;
      }
    });
  }

  closeAnalyticsModal(): void {
    this.showAnalyticsModal = false;
    this.analytics = null;
    this.selectedLink = null;
  }

  getAnalyticsArray(obj: { [key: string]: number }): { key: string; value: number }[] {
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }
}
