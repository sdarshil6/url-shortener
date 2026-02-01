import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Link, CreateLinkRequest, UpdateLinkRequest, LinkAnalytics, PaginatedLinkResponse, LinkQueryParams } from '../models/link.model';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private readonly API_URL = environment.apiUrl;
  private linkCreatedSubject = new Subject<void>();

  linkCreated$ = this.linkCreatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  notifyLinkCreated(): void {
    this.linkCreatedSubject.next();
  }

  getUserLinks(): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.API_URL}/me/urls`);
  }

  getUserLinksPaginated(queryParams: LinkQueryParams): Observable<PaginatedLinkResponse> {
    let params = new HttpParams();
    
    if (queryParams.page) params = params.set('page', queryParams.page.toString());
    if (queryParams.limit) params = params.set('limit', queryParams.limit.toString());
    if (queryParams.search) params = params.set('search', queryParams.search);
    if (queryParams.sort_by) params = params.set('sort_by', queryParams.sort_by);
    if (queryParams.sort_order) params = params.set('sort_order', queryParams.sort_order);
    if (queryParams.filter_status) params = params.set('filter_status', queryParams.filter_status);
    
    return this.http.get<PaginatedLinkResponse>(`${this.API_URL}/me/urls/paginated`, { params });
  }

  createLink(data: CreateLinkRequest): Observable<Link> {
    return this.http.post<Link>(`${this.API_URL}/url`, data);
  }

  updateLink(data: UpdateLinkRequest): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.API_URL}/admin/${data.secret_key}`,
      { target_url: data.target_url }
    );
  }

  deleteLink(secretKey: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/admin/${secretKey}`);
  }

  getAnalytics(secretKey: string): Observable<LinkAnalytics> {
    return this.http.get<LinkAnalytics>(`${this.API_URL}/admin/${secretKey}/analytics`);
  }
}
