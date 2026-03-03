import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PricingPlan } from '../models/pricing.model';

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Fetch plans (public, no auth). */
  getPlans(): Observable<PricingPlan[]> {
    return this.http.get<PricingPlan[]>(`${this.API_URL}/api/pricing`).pipe(
      timeout(10000)
    );
  }
}
