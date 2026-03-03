import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PricingService } from '../../core/services/pricing.service';
import { AuthService } from '../../core/services/auth.service';
import { PricingPlan } from '../../core/models/pricing.model';
@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent implements OnInit {
  private pricingService = inject(PricingService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  plans: PricingPlan[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    console.log('PricingComponent: Fetching plans...');
    this.pricingService.getPlans().subscribe({
      next: (data) => {
        console.log('PricingComponent: Received data', data);
        this.plans = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('PricingComponent: Error', err);
        this.error = 'Unable to load pricing. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
      complete: () => {
        console.log('PricingComponent: Observable complete');
      }
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  formatPrice(value: number, currency: string): string {
    if (value === 0) return 'Free';
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol}${value.toLocaleString()}`;
  }

  formatLimit(value: number): string {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  }

  getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'GBP': '£',
      'AUD': 'A$',
      'BRL': 'R$'
    };
    return symbols[currency] || currency;
  }
}
