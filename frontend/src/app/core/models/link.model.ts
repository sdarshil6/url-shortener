export interface Link {
  url: string;
  target_url: string;
  clicks: number;
  created_at: string;
  expires_at: string | null;
  qr_code: string;
  admin_url: string;
}

export interface CreateLinkRequest {
  target_url: string;
  custom_key?: string;
  expires_at?: string;
}

export interface UpdateLinkRequest {
  secret_key: string;
  target_url: string;
}

export interface LinkAnalytics {
  total_clicks: number;
  unique_clicks: number;
  top_referrers: { item: string; count: number }[];
  clicks_by_country: { item: string; count: number }[];
  clicks_by_browser: { item: string; count: number }[];
  clicks_by_os: { item: string; count: number }[];
  click_timeline: { date: string; count: number }[];
}
