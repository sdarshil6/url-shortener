# Dynamic Feature Generation from Database Columns

## Overview
Features are now **100% dynamically generated** from database columns instead of being hardcoded in JSON arrays.

## Database Schema

### pricing_plans Table

**Limit Columns** (generate feature text):
- `links_limit` → "Up to X shortened links" or "Unlimited shortened links"
- `qr_codes_limit` → "X QR codes" or "Unlimited QR codes"  
- `custom_links_limit` → "X custom links" or "Unlimited custom links"

**Feature Flag Columns** (boolean):
- `has_basic_analytics` → "Basic click analytics"
- `has_advanced_analytics` → "Advanced analytics"
- `has_detailed_geo` → "Detailed geo analytics"
- `has_device_tracking` → "Device tracking"
- `has_link_editing` → "Edit links"
- `has_link_expiration` → "Set link expiration"
- `has_custom_integrations` → "Custom integrations"
- `has_sla_guarantee` → "SLA guarantee"
- `has_account_manager` → "Dedicated account manager"

**Support Level Column** (string):
- `support_level = "basic"` → "Email support"
- `support_level = "priority"` → "Priority support"
- `support_level = "dedicated"` → "Dedicated support"

## How It Works

1. **Backend (crud.py)**: `get_pricing_plans_for_country()` reads plan columns and generates features list dynamically
2. **Frontend**: Receives pre-generated features array and displays them
3. **No Hardcoded Text**: All feature descriptions come from database column values

## Example

### Database Row:
```
links_limit: 150
qr_codes_limit: 25
custom_links_limit: -1
has_advanced_analytics: TRUE
has_link_editing: TRUE
support_level: 'priority'
```

### Generated Features:
```json
[
  "Up to 150 shortened links",
  "25 QR codes",
  "Unlimited custom links",
  "Advanced analytics",
  "Edit links",
  "Priority support"
]
```

## Benefits

1. ✅ **No Hardcoded Strings** - All features from DB columns
2. ✅ **Easy Updates** - Change limits/flags in DB → features update automatically
3. ✅ **Consistent Logic** - Single source of truth (database)
4. ✅ **Scalable** - Add new feature flags by adding columns
5. ✅ **Type-Safe** - Boolean flags prevent typos

## Updating Features

### To change limits:
```sql
UPDATE pricing_plans SET links_limit = 200 WHERE slug = 'pro';
```

### To enable a feature:
```sql
UPDATE pricing_plans SET has_device_tracking = TRUE WHERE slug = 'pro';
```

### To change support level:
```sql
UPDATE pricing_plans SET support_level = 'dedicated' WHERE slug = 'business';
```

## Current Plans

| Plan | Links | QR | Custom | Analytics | Editing | Support |
|------|-------|----|----|-----------|---------|---------|
| Starter | 20 | 5 | 5 | Basic | ❌ | Email |
| Pro | 150 | 25 | ∞ | Advanced | ✅ | Priority |
| Business | 1,000 | 100 | ∞ | Advanced + Geo + Device | ✅ | Dedicated |
| Enterprise | ∞ | ∞ | ∞ | All + SLA + Manager | ✅ | Dedicated |
