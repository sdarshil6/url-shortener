PLAN_PERMISSIONS = {
    "starter": {
        "advanced_analytics": False,
        "detailed_geo": False,
        "device_tracking": False,
        "edit_links": False,
        "set_expiration": False,
    },
    "pro": {
        "advanced_analytics": True,
        "detailed_geo": False,
        "device_tracking": False,
        "edit_links": True,
        "set_expiration": True,
    },
    "business": {
        "advanced_analytics": True,
        "detailed_geo": True,
        "device_tracking": True,
        "edit_links": True,
        "set_expiration": True,
    },
    "enterprise": {
        "advanced_analytics": True,
        "detailed_geo": True,
        "device_tracking": True,
        "edit_links": True,
        "set_expiration": True,
    },
}

# Define the monthly usage limits for each plan
PLAN_LIMITS = {
    "starter": {
        "links": 20,
        "qr_codes": 5,
        "custom_links": 5,
    },
    "pro": {
        "links": 150,
        "qr_codes": 25,
        "custom_links": float('inf'),  # Represents unlimited
    },
    "business": {
        "links": 1000,
        "qr_codes": 100,
        "custom_links": float('inf'),
    },
    "enterprise": {
        "links": float('inf'),
        "qr_codes": float('inf'),
        "custom_links": float('inf'),
    },
}
