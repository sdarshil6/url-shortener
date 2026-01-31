import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Link, CreateLinkRequest, UpdateLinkRequest, LinkAnalytics } from '../models/link.model';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserLinks(): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.API_URL}/me/urls`);
  }

  createLink(data: CreateLinkRequest): Observable<Link> {
    return this.http.post<Link>(`${this.API_URL}/url`, data);
  }

  updateLink(data: UpdateLinkRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.API_URL}/urls/${data.secret_key}`,
      { target_url: data.target_url }
    );
  }

  getAnalytics(secretKey: string): Observable<LinkAnalytics> {
    return this.http.get<LinkAnalytics>(`${this.API_URL}/admin/${secretKey}/analytics`);
  }
}
