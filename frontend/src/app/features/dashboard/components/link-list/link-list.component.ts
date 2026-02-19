import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { LinkService } from '../../../../core/services/link.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DateService } from '../../../../shared/services/date.service';
import { Link, LinkAnalytics, LinkQueryParams } from '../../../../core/models/link.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { PAGINATION, SEARCH } from '../../../../shared/constants/app.constants';
import { LINK_MESSAGES } from '../../../../shared/constants/messages.constants';

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
  itemsPerPage = PAGINATION.defaultItemsPerPage;
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
  minDate: string;

  analytics: LinkAnalytics | null = null;
  analyticsLoading = false;

  private linkCreatedSubscription?: Subscription;
  private searchSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private linkService: LinkService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private dateService: DateService
  ) {
    this.minDate = this.dateService.getCurrentDateString();
  }

  ngOnInit(): void {
    this.editForm = this.fb.group({
      target_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      custom_code: ['', [Validators.pattern(/^[a-zA-Z0-9_-]*$/)]],
      expires_at: ['', [this.futureDateValidator.bind(this)]]
    });

    // Setup search debouncing
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(SEARCH.debounceMs),
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
    const maxVisible = PAGINATION.maxVisiblePages;
    
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

  exportLinks(): void {
    if (this.totalItems === 0 || this.loading) return;

    this.linkService.exportToExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `links-export-${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toastService.success(LINK_MESSAGES.exportSuccess);
      },
      error: (error) => {
        const errorMessage = this.getErrorMessage(error, 'export your links');
        this.toastService.error(errorMessage);
      }
    });
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
    return this.dateService.formatToDDMMYYYY(expiresAt);
  }

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > now ? null : { pastDate: true };
  }

  private async checkCustomCodeAvailability(customCode: string): Promise<boolean> {
    if (!customCode || customCode === this.selectedLink?.url.split('/').pop()) {
      return true;
    }
    try {
      await this.linkService.getUserLinks().toPromise();
      return true;
    } catch (error: any) {
      if (error.status === 409 || (error.error && error.error.detail && error.error.detail.includes('already exists'))) {
        return false;
      }
      return true;
    }
  }

  copyToClipboard(shortCode: string): void {
    const url = this.getShortUrl(shortCode);
    navigator.clipboard.writeText(url);
    this.toastService.success(LINK_MESSAGES.LINK_COPIED);
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
    this.toastService.success(LINK_MESSAGES.QR_CODE_DOWNLOADED);
  }

  openEditModal(link: Link): void {
    this.selectedLink = link;
    const shortCode = link.url.split('/').pop() || '';
    this.editForm.patchValue({
      target_url: link.target_url,
      custom_code: shortCode,
      expires_at: this.dateService.toDateInputValue(link.expires_at)
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

  async saveEdit(): Promise<void> {
    if (this.editForm.valid && this.selectedLink) {
      const customCode = this.editForm.value.custom_code;
      const originalCode = this.selectedLink.url.split('/').pop() || '';
      
      // Validate custom code if changed
      if (customCode && customCode !== originalCode) {
        const isAvailable = await this.checkCustomCodeAvailability(customCode);
        if (!isAvailable) {
          this.toastService.error('Custom code already exists. Please choose another.');
          return;
        }
      }
      
      this.editLoading = true;
      const updateData: any = {
        secret_key: this.selectedLink.admin_url,
        target_url: this.editForm.value.target_url
      };
      
      if (customCode) {
        updateData.custom_key = customCode;
      }
      
      if (this.editForm.value.expires_at) {
        updateData.expires_at = this.dateService.toISOString(this.editForm.value.expires_at);
      }
      
      this.linkService.updateLink(updateData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.editLoading = false;
          this.toastService.success(LINK_MESSAGES.LINK_UPDATED);
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
          this.toastService.success(LINK_MESSAGES.LINK_DELETED);
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
