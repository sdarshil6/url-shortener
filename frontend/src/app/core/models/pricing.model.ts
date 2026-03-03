/** Plan from /pricing API */
export interface PricingPlan {
  id: number;
  slug: string;
  display_name: string;
  description: string | null;
  features: string[];
  links_limit: number;
  qr_codes_limit: number;
  custom_links_limit: number;
  is_popular: boolean;
  sort_order: number;
  price_monthly: number;
  price_yearly: number;
  currency: string;
}
