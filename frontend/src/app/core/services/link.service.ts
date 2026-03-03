import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { retry, delay, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Link, CreateLinkRequest, UpdateLinkRequest, LinkAnalytics, PaginatedLinkResponse, LinkQueryParams } from '../models/link.model';
import { API_RETRY } from '../../shared/constants/app.constants';

export interface BulkUploadProgress {
  type: 'progress' | 'success';
  progress: number;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private readonly API_URL = environment.apiUrl;
  private linkCreatedSubject = new Subject<void>();
  private bulkUploadAbortController: AbortController | null = null;

  linkCreated$ = this.linkCreatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  notifyLinkCreated(): void {
    this.linkCreatedSubject.next();
  }

  getUserLinks(): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.API_URL}/me/urls`).pipe(
      retry({
        count: API_RETRY.count,
        delay: (error, retryCount) => {
          // Exponential backoff
          return delay(Math.min(API_RETRY.baseDelay * retryCount, API_RETRY.maxDelay))(error);
        }
      })
    );
  }

  getUserLinksPaginated(queryParams: LinkQueryParams): Observable<PaginatedLinkResponse> {
    let params = new HttpParams();
    
    if (queryParams.page) params = params.set('page', queryParams.page.toString());
    if (queryParams.limit) params = params.set('limit', queryParams.limit.toString());
    if (queryParams.search) params = params.set('search', queryParams.search);
    if (queryParams.sort_by) params = params.set('sort_by', queryParams.sort_by);
    if (queryParams.sort_order) params = params.set('sort_order', queryParams.sort_order);
    if (queryParams.filter_status) params = params.set('filter_status', queryParams.filter_status);
    
    return this.http.get<PaginatedLinkResponse>(`${this.API_URL}/me/urls/paginated`, { params }).pipe(
      retry({
        count: API_RETRY.count,
        delay: (error, retryCount) => {
          return delay(Math.min(API_RETRY.baseDelay * retryCount, API_RETRY.maxDelay))(error);
        }
      })
    );
  }

  createLink(data: CreateLinkRequest): Observable<Link> {
    return this.http.post<Link>(`${this.API_URL}/url`, data);
  }

  updateLink(data: UpdateLinkRequest): Observable<{ message: string }> {
    const payload: any = { target_url: data.target_url };
    if (data.custom_key) payload.custom_key = data.custom_key;
    if (data.expires_at) payload.expires_at = data.expires_at;
    
    return this.http.patch<{ message: string }>(
      `${this.API_URL}/admin/${data.secret_key}`,
      payload
    );
  }

  deleteLink(secretKey: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/admin/${secretKey}`);
  }

  getAnalytics(secretKey: string): Observable<LinkAnalytics> {
    return this.http.get<LinkAnalytics>(`${this.API_URL}/admin/${secretKey}/analytics`).pipe(
      retry({
        count: 1,
        delay: API_RETRY.baseDelay
      })
    );
  }

  exportToExcel(): Observable<Blob> {
    return this.http.get(`${this.API_URL}/me/urls/export`, {
      responseType: 'blob'
    }).pipe(
      retry({
        count: 1,
        delay: API_RETRY.baseDelay
      })
    );
  }

  uploadBulkLinks(file: File): Observable<BulkUploadProgress> {
    const formData = new FormData();
    formData.append('file', file);

    // Create new AbortController for this upload
    this.bulkUploadAbortController = new AbortController();

    return new Observable<BulkUploadProgress>(observer => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          observer.next({ type: 'progress', progress });
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            observer.next({ type: 'success', progress: 100, data: response });
            observer.complete();
          } catch (e) {
            observer.error(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            observer.error(errorResponse);
          } catch (e) {
            observer.error(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        observer.error(new Error('Network error occurred during upload'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        observer.error(new Error('Upload cancelled'));
      });

      // Setup abort signal
      this.bulkUploadAbortController?.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Get auth token from localStorage
      const token = localStorage.getItem('token');

      // Open and send request
      xhr.open('POST', `${this.API_URL}/me/urls/bulk`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  cancelBulkUpload(): void {
    if (this.bulkUploadAbortController) {
      this.bulkUploadAbortController.abort();
      this.bulkUploadAbortController = null;
    }
  }
}
