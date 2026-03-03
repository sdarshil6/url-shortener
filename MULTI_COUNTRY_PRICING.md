# Multi-Country Pricing Implementation

## Overview
Implemented country-specific pricing for 5 countries (India, USA, UK, Australia, Brazil) with automatic IP-based detection and fallback to USA pricing.

## Database Structure

### Table: `pricing_plans`
Base plan information (same across all countries):
- `id` (PK)
- `slug` (unique)
- `display_name`
- `description`
- `features` (JSONB array)
- `links_limit` (integer, -1 = unlimited)
- `qr_codes_limit` (integer, -1 = unlimited)
- `custom_links_limit` (integer, -1 = unlimited)
- `is_popular` (boolean)
- `sort_order` (integer)
- `is_active` (boolean)

### Table: `pricing_country_rates`
Country-specific pricing:
- `id` (PK)
- `plan_id` (FK to pricing_plans)
- `country_code` (2-letter ISO code: IN, US, GB, AU, BR)
- `currency` (3-letter: INR, USD, GBP, AUD, BRL)
- `price_monthly` (float)
- `price_yearly` (float)

## Pricing Strategy

### Starter Plan (Free - All Countries)
- 20 links, 5 QR codes, 5 custom links
- Price: Free everywhere

### Pro Plan
| Country | Currency | Monthly | Yearly |
|---------|----------|---------|--------|
| India   | INR      | ₹499    | ₹4,990 |
| USA     | USD      | $9      | $90    |
| UK      | GBP      | £7      | £70    |
| Australia | AUD    | A$12    | A$120  |
| Brazil  | BRL      | R$45    | R$450  |

- 150 links, 25 QR codes, unlimited custom links

### Business Plan
| Country | Currency | Monthly | Yearly |
|---------|----------|---------|--------|
| India   | INR      | ₹1,499  | ₹14,990|
| USA     | USD      | $29     | $290   |
| UK      | GBP      | £22     | £220   |
| Australia | AUD    | A$39    | A$390  |
| Brazil  | BRL      | R$150   | R$1,500|

- 1,000 links, 100 QR codes, unlimited custom links

### Enterprise Plan (Contact Sales - All Countries)
- Unlimited everything
- Price: Contact for quote

## Backend Implementation

### Country Detection
1. Extract client IP from request
2. Skip local/private IPs (127.0.0.1, 192.168.x.x, etc.)
3. Use ip-api.com to get country code
4. Fallback to 'US' if:
   - IP is local
   - Geolocation fails
   - Country not in supported list

### API Endpoint
**GET** `/api/pricing`
- No authentication required (public)
- Returns plans with country-specific pricing
- Response includes currency symbol

### Files Modified
- `backend/models.py` - New schema with 2 tables
- `backend/schemas.py` - Updated schemas
- `backend/crud.py` - New function `get_pricing_plans_for_country()`
- `backend/main.py` - Updated endpoint with country detection
- `backend/enrichment.py` - Added `country_code` to geolocation response
- `backend/seed_pricing_multi_country.py` - New seeding script

## Frontend Implementation

### Currency Display
- Automatic currency symbol mapping:
  - INR → ₹
  - USD → $
  - GBP → £
  - AUD → A$
  - BRL → R$

### Responsive Display
- Larger fonts for better readability
- Mobile-optimized layout
- Proper number formatting with locale-aware thousand separators

### Files Modified
- `frontend/src/app/core/models/pricing.model.ts` - Updated interface
- `frontend/src/app/features/pricing/pricing.component.ts` - Currency formatting
- `frontend/src/app/features/pricing/pricing.component.html` - Template updates
- `frontend/src/app/features/pricing/pricing.component.scss` - Font size increases

## Database Migration

To recreate the database structure:

```bash
cd backend
python -c "from database import engine; from models import Base; Base.metadata.drop_all(engine); Base.metadata.create_all(engine)"
python seed_pricing_multi_country.py
```

## Testing

### Test with different IPs
```bash
# Default (local IP) - returns USD pricing
curl http://localhost:4200/api/pricing

# Test with specific country IP (requires setting X-Forwarded-For header)
# In production, the actual client IP will be used
```

### Verify database
```bash
cd backend
python -c "from database import SessionLocal; from models import PricingPlan, PricingCountryRate; db = SessionLocal(); print(f'Plans: {db.query(PricingPlan).count()}'); print(f'Rates: {db.query(PricingCountryRate).count()}')"
```

## Production Considerations

1. **CDN/Proxy**: Ensure X-Forwarded-For or X-Real-IP headers are passed
2. **Caching**: Consider caching geolocation results per IP (5-15 min TTL)
3. **Rate Limiting**: ip-api.com free tier: 45 req/min
4. **Currency Updates**: Prices are static; update via database
5. **New Countries**: Add rows to `pricing_country_rates` table

## Future Enhancements

1. Add currency conversion API for dynamic pricing
2. Add more countries
3. Allow users to manually select country/currency
4. Add purchasing power parity (PPP) adjustments
5. Seasonal/promotional pricing per country
