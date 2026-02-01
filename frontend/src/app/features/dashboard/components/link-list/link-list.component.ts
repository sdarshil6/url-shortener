import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { LinkService } from '../../../../core/services/link.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Link, LinkAnalytics, LinkQueryParams } from '../../../../core/models/link.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-link-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent, ButtonComponent, InputComponent, SkeletonLoaderComponent],
  templateUrl: './link-list.component.html',
  styleUrls: ['./link-list.component.scss']
})
export class LinkListComponent implements OnInit, OnDestroy {
  links: Link[] = [];
  loading = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  totalPages = 0;

  // Search and filters
  searchQuery = '';
  searchSubject = new Subject<string>();
  sortBy: 'created_at' | 'clicks' | 'expires_at' = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';
  filterStatus: 'active' | 'expired' | null = null;

  showQRModal = false;
  showEditModal = false;
  showAnalyticsModal = false;

  selectedLink: Link | null = null;
  editForm!: FormGroup;
  editLoading = false;

  analytics: LinkAnalytics | null = null;
  analyticsLoading = false;

  private linkCreatedSubscription?: Subscription;
  private searchSubscription?: Subscription;
  private destroy$ = new Subject<void>();

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

    // Setup search debouncing
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      this.searchQuery = searchValue;
      this.currentPage = 1;
      this.loadLinks();
    });

    this.loadLinks();
    
    this.linkCreatedSubscription = this.linkService.linkCreated$.subscribe(() => {
      this.currentPage = 1;
      this.loadLinks();
    });
  }

  ngOnDestroy(): void {
    this.linkCreatedSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLinks(): void {
    this.loading = true;
    
    const queryParams: LinkQueryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };

    if (this.searchQuery) {
      queryParams.search = this.searchQuery;
    }

    if (this.filterStatus) {
      queryParams.filter_status = this.filterStatus;
    }

    this.linkService.getUserLinksPaginated(queryParams).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.links = response.items;
        this.totalItems = response.total;
        this.totalPages = response.total_pages;
        this.currentPage = response.page;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = this.getErrorMessage(error, 'load your links');
        this.toastService.error(errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onSortChange(sortBy: 'created_at' | 'clicks' | 'expires_at'): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.currentPage = 1;
    this.loadLinks();
  }

  onFilterChange(status: 'active' | 'expired' | null): void {
    this.filterStatus = status;
    this.currentPage = 1;
    this.loadLinks();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadLinks();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadLinks();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLinks();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(this.currentPage - 1);
        pages.push(this.currentPage);
        pages.push(this.currentPage + 1);
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  refreshLinks(): void {
    this.currentPage = 1;
    this.loadLinks();
    this.toastService.info('Your links have been refreshed.');
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = null;
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
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
      }).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.editLoading = false;
          this.toastService.success('Your link has been updated.');
          this.closeEditModal();
          this.loadLinks();
        },
        error: (error) => {
          this.editLoading = false;
          const errorMessage = this.getErrorMessage(error, 'update your link');
          this.toastService.error(errorMessage);
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
    this.linkService.getAnalytics(link.admin_url).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        // Ensure state update happens in next tick to avoid NG0100
        setTimeout(() => {
          this.analyticsLoading = false;
          const errorMessage = this.getErrorMessage(error, 'load analytics');
          this.toastService.error(errorMessage);
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
      this.linkService.deleteLink(link.admin_url).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('Link deleted successfully.');
          this.loadLinks();
        },
        error: (error) => {
          const errorMessage = this.getErrorMessage(error, 'delete the link');
          this.toastService.error(errorMessage);
        }
      });
    }
  }

  getAnalyticsArray(obj: { [key: string]: number } | undefined | null): { key: string; value: number }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }

  private getErrorMessage(error: any, action: string): string {
    if (error.status === 0) {
      return `Network error. Please check your connection and try to ${action} again.`;
    }
    if (error.status === 401) {
      return `Your session has expired. Please log in again.`;
    }
    if (error.status === 403) {
      return `You don't have permission to ${action}.`;
    }
    if (error.status === 404) {
      return `The requested resource was not found. Please refresh and try again.`;
    }
    if (error.status === 429) {
      return `Too many requests. Please wait a moment before trying to ${action} again.`;
    }
    if (error.status >= 500) {
      return `Server error. Our team has been notified. Please try to ${action} later.`;
    }
    
    const message = error.error?.detail || error.error?.message;
    if (message) {
      return message;
    }
    
    return `Unable to ${action}. Please try again or contact support if the issue persists.`;
  }
}
