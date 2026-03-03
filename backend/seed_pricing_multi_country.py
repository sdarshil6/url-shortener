"""
Multi-country pricing seed data with feature flags.
Features are generated dynamically from column values.
"""

from database import SessionLocal
from models import PricingPlan, PricingCountryRate


def clear_pricing_tables(db):
    """Clear pricing tables."""
    db.query(PricingCountryRate).delete()
    db.query(PricingPlan).delete()
    db.commit()
    print("Cleared pricing tables")


def seed_multi_country_pricing(db):
    """Seed pricing plans with feature flags and rates for 5 countries."""
    
    # Check if plans already exist
    if db.query(PricingPlan).first():
        print("Pricing plans already exist, skipping")
        return
    
    # Plan definitions with feature flags
    plans_data = [
        {
            "slug": "starter",
            "display_name": "Starter",
            "description": "Perfect for individuals and small projects",
            "links_limit": 20,
            "qr_codes_limit": 5,
            "custom_links_limit": 5,
            "has_basic_analytics": True,
            "has_advanced_analytics": False,
            "has_detailed_geo": False,
            "has_device_tracking": False,
            "has_link_editing": False,
            "has_link_expiration": False,
            "has_custom_integrations": False,
            "has_sla_guarantee": False,
            "has_account_manager": False,
            "support_level": "basic",
            "is_popular": False,
            "sort_order": 1,
        },
        {
            "slug": "pro",
            "display_name": "Pro",
            "description": "For growing teams and professionals",
            "links_limit": 150,
            "qr_codes_limit": 25,
            "custom_links_limit": -1,
            "has_basic_analytics": True,
            "has_advanced_analytics": True,
            "has_detailed_geo": False,
            "has_device_tracking": False,
            "has_link_editing": True,
            "has_link_expiration": True,
            "has_custom_integrations": False,
            "has_sla_guarantee": False,
            "has_account_manager": False,
            "support_level": "priority",
            "is_popular": True,
            "sort_order": 2,
        },
        {
            "slug": "business",
            "display_name": "Business",
            "description": "For enterprises and high-volume usage",
            "links_limit": 1000,
            "qr_codes_limit": 100,
            "custom_links_limit": -1,
            "has_basic_analytics": True,
            "has_advanced_analytics": True,
            "has_detailed_geo": True,
            "has_device_tracking": True,
            "has_link_editing": True,
            "has_link_expiration": True,
            "has_custom_integrations": False,
            "has_sla_guarantee": False,
            "has_account_manager": False,
            "support_level": "dedicated",
            "is_popular": False,
            "sort_order": 3,
        },
        {
            "slug": "enterprise",
            "display_name": "Enterprise",
            "description": "Custom solutions for large organizations",
            "links_limit": -1,
            "qr_codes_limit": -1,
            "custom_links_limit": -1,
            "has_basic_analytics": True,
            "has_advanced_analytics": True,
            "has_detailed_geo": True,
            "has_device_tracking": True,
            "has_link_editing": True,
            "has_link_expiration": True,
            "has_custom_integrations": True,
            "has_sla_guarantee": True,
            "has_account_manager": True,
            "support_level": "dedicated",
            "is_popular": False,
            "sort_order": 4,
        },
    ]
    
    # Country-specific pricing
    country_rates = {
        "starter": {
            "IN": {"currency": "INR", "monthly": 0, "yearly": 0},
            "US": {"currency": "USD", "monthly": 0, "yearly": 0},
            "GB": {"currency": "GBP", "monthly": 0, "yearly": 0},
            "AU": {"currency": "AUD", "monthly": 0, "yearly": 0},
            "BR": {"currency": "BRL", "monthly": 0, "yearly": 0},
        },
        "pro": {
            "IN": {"currency": "INR", "monthly": 499, "yearly": 4990},
            "US": {"currency": "USD", "monthly": 9, "yearly": 90},
            "GB": {"currency": "GBP", "monthly": 7, "yearly": 70},
            "AU": {"currency": "AUD", "monthly": 12, "yearly": 120},
            "BR": {"currency": "BRL", "monthly": 45, "yearly": 450},
        },
        "business": {
            "IN": {"currency": "INR", "monthly": 1499, "yearly": 14990},
            "US": {"currency": "USD", "monthly": 29, "yearly": 290},
            "GB": {"currency": "GBP", "monthly": 22, "yearly": 220},
            "AU": {"currency": "AUD", "monthly": 39, "yearly": 390},
            "BR": {"currency": "BRL", "monthly": 150, "yearly": 1500},
        },
        "enterprise": {
            "IN": {"currency": "INR", "monthly": 0, "yearly": 0},
            "US": {"currency": "USD", "monthly": 0, "yearly": 0},
            "GB": {"currency": "GBP", "monthly": 0, "yearly": 0},
            "AU": {"currency": "AUD", "monthly": 0, "yearly": 0},
            "BR": {"currency": "BRL", "monthly": 0, "yearly": 0},
        },
    }
    
    # Create plans and rates
    for plan_data in plans_data:
        slug = plan_data["slug"]
        
        # Create base plan
        plan = PricingPlan(
            slug=slug,
            display_name=plan_data["display_name"],
            description=plan_data["description"],
            links_limit=plan_data["links_limit"],
            qr_codes_limit=plan_data["qr_codes_limit"],
            custom_links_limit=plan_data["custom_links_limit"],
            has_basic_analytics=plan_data["has_basic_analytics"],
            has_advanced_analytics=plan_data["has_advanced_analytics"],
            has_detailed_geo=plan_data["has_detailed_geo"],
            has_device_tracking=plan_data["has_device_tracking"],
            has_link_editing=plan_data["has_link_editing"],
            has_link_expiration=plan_data["has_link_expiration"],
            has_custom_integrations=plan_data["has_custom_integrations"],
            has_sla_guarantee=plan_data["has_sla_guarantee"],
            has_account_manager=plan_data["has_account_manager"],
            support_level=plan_data["support_level"],
            is_popular=plan_data["is_popular"],
            sort_order=plan_data["sort_order"],
            is_active=True
        )
        db.add(plan)
        db.flush()  # Get plan.id
        
        # Create country rates
        for country_code, rate_data in country_rates[slug].items():
            rate = PricingCountryRate(
                plan_id=plan.id,
                country_code=country_code,
                currency=rate_data["currency"],
                price_monthly=rate_data["monthly"],
                price_yearly=rate_data["yearly"]
            )
            db.add(rate)
    
    db.commit()
    print(f"Seeded {len(plans_data)} plans with feature flags")


def main():
    """Main seeding function."""
    db = SessionLocal()
    
    try:
        print("Seeding multi-country pricing with feature flags...")
        print("-" * 50)
        
        clear_pricing_tables(db)
        seed_multi_country_pricing(db)
        
        print("-" * 50)
        print("Multi-country pricing seeding completed!")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
