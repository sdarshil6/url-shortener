"""
Database seeding script for URL Shortener application.
Populates urls and clicks tables with realistic data.
"""

import random
import secrets
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import Base, URL, Click, PricingPlan

# Initialize Faker
fake = Faker()

# Realistic data distributions
USER_AGENTS = [
    # Chrome (45%)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
    
    # Safari (25%)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    
    # Firefox (15%)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
    
    # Edge (10%)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    
    # Mobile browsers (5%)
    "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
]

COUNTRIES = [
    # Realistic geo distribution
    ("United States", "California", "San Francisco"),
    ("United States", "New York", "New York"),
    ("United States", "Texas", "Austin"),
    ("United States", "Washington", "Seattle"),
    ("United States", "Illinois", "Chicago"),
    ("United States", "Florida", "Miami"),
    ("United Kingdom", "England", "London"),
    ("United Kingdom", "England", "Manchester"),
    ("Canada", "Ontario", "Toronto"),
    ("Canada", "British Columbia", "Vancouver"),
    ("Germany", "Berlin", "Berlin"),
    ("Germany", "Bavaria", "Munich"),
    ("France", "Île-de-France", "Paris"),
    ("India", "Maharashtra", "Mumbai"),
    ("India", "Karnataka", "Bangalore"),
    ("India", "Delhi", "New Delhi"),
    ("Australia", "New South Wales", "Sydney"),
    ("Japan", "Tokyo", "Tokyo"),
    ("Brazil", "São Paulo", "São Paulo"),
    ("Netherlands", "North Holland", "Amsterdam"),
]

BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Opera"]
OS_LIST = ["Windows", "macOS", "Linux", "iOS", "Android"]
DEVICE_TYPES = ["Desktop", "Mobile", "Tablet"]

REFERRERS = [
    "https://www.google.com/",
    "https://www.facebook.com/",
    "https://twitter.com/",
    "https://www.linkedin.com/",
    "https://www.reddit.com/",
    "https://t.co/",
    "https://www.instagram.com/",
    "https://www.youtube.com/",
    "https://news.ycombinator.com/",
    "https://www.pinterest.com/",
    None,  # Direct traffic
]

TARGET_URLS = [
    "https://www.amazon.com/dp/B08N5WRWNW",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://github.com/microsoft/vscode",
    "https://stackoverflow.com/questions/12345678",
    "https://www.linkedin.com/in/johndoe",
    "https://medium.com/@author/article-title-123",
    "https://www.netflix.com/title/80057281",
    "https://docs.python.org/3/library/functions.html",
    "https://www.nytimes.com/2025/01/15/world/article.html",
    "https://www.bbc.com/news/technology-12345678",
    "https://www.theguardian.com/world/2025/jan/15/breaking-news",
    "https://techcrunch.com/2025/01/15/startup-funding",
    "https://www.forbes.com/sites/forbes/2025/01/15/business",
    "https://www.wsj.com/articles/market-update-123456",
    "https://www.reddit.com/r/programming/comments/abc123",
    "https://twitter.com/username/status/1234567890",
    "https://www.shopify.com/blog/ecommerce-trends",
    "https://blog.google/products/chrome/new-features",
    "https://www.spotify.com/us/premium/",
    "https://drive.google.com/file/d/1abcdef/view",
]


def generate_unique_key(db: Session, length: int = 5, max_attempts: int = 10) -> str:
    """Generate a unique URL-safe key."""
    for _ in range(max_attempts):
        key = secrets.token_urlsafe(length)[:length]
        existing = db.query(URL).filter(URL.key == key).first()
        if not existing:
            return key
    raise ValueError("Failed to generate unique key after maximum attempts")


def create_urls(db: Session, user_id: int, count: int = 120) -> list:
    """Create URL records with uniform distribution."""
    urls = []
    now = datetime.now()
    
    for i in range(count):
        # Generate creation timestamp (last 6 months)
        days_ago = random.randint(0, 180)
        created_at = now - timedelta(days=days_ago)
        
        # Generate keys
        key = generate_unique_key(db, length=5)
        secret_key = secrets.token_urlsafe(8)[:8]
        
        # Target URL (uniform distribution)
        target_url = random.choice(TARGET_URLS)
        
        # 90% active, 10% inactive (uniform)
        is_active = random.random() < 0.9
        
        # 50% have expiration dates
        expires_at = None
        if random.random() < 0.5:
            days_until_expiry = random.randint(30, 365)
            expires_at = created_at + timedelta(days=days_until_expiry)
        
        url = URL(
            key=key,
            secret_key=secret_key,
            target_url=target_url,
            is_active=is_active,
            clicks=0,  # Will be updated when creating clicks
            expires_at=expires_at,
            created_at=created_at,
            owner_id=user_id
        )
        
        db.add(url)
        urls.append(url)
        
        # Commit in batches
        if (i + 1) % 20 == 0:
            db.commit()
            print(f"Created {i + 1}/{count} URLs...")
    
    db.commit()
    print(f"✓ Created {count} URLs")
    return urls


def create_clicks(db: Session, urls: list, count: int = 2000) -> None:
    """Create click records with realistic distributions."""
    clicks = []
    now = datetime.now()
    
    # Geo distribution weights (realistic)
    geo_weights = [0.4] * 6 + [0.1] * 4 + [0.05] * 10  # 40% US, 10% UK/Canada, 5% others
    
    # Browser distribution from user agents
    ua_weights = [0.45] * 5 + [0.25] * 3 + [0.15] * 3 + [0.10] * 1 + [0.05] * 2
    
    # Device type distribution (70% mobile, 25% desktop, 5% tablet)
    device_weights = {
        "Desktop": 0.25,
        "Mobile": 0.70,
        "Tablet": 0.05
    }
    
    # Create weighted URL selection (few viral URLs with many clicks)
    # 5% of URLs get 60% of clicks, 15% get 25% of clicks, rest get 15%
    num_urls = len(urls)
    viral_count = max(1, int(num_urls * 0.05))  # ~6 URLs
    popular_count = max(1, int(num_urls * 0.15))  # ~18 URLs
    
    viral_urls = urls[:viral_count]
    popular_urls = urls[viral_count:viral_count + popular_count]
    regular_urls = urls[viral_count + popular_count:]
    
    # Assign click counts
    viral_clicks = int(count * 0.60)
    popular_clicks = int(count * 0.25)
    regular_clicks = count - viral_clicks - popular_clicks
    
    # Create weighted URL pool
    url_pool = (viral_urls * (viral_clicks // len(viral_urls) + 1) +
                popular_urls * (popular_clicks // len(popular_urls) + 1) +
                regular_urls * (regular_clicks // len(regular_urls) + 1))
    random.shuffle(url_pool)
    
    for i in range(count):
        # Select URL (weighted distribution)
        url = url_pool[i % len(url_pool)]
        
        # Click timestamp (within URL's lifetime)
        url_age_days = (now - url.created_at).days
        if url_age_days > 0:
            days_after_creation = random.randint(0, url_age_days)
            timestamp = url.created_at + timedelta(
                days=days_after_creation,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
        else:
            timestamp = url.created_at + timedelta(
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
        
        # Generate IP address
        ip_address = fake.ipv4()
        
        # User agent with realistic distribution
        user_agent = random.choices(USER_AGENTS, weights=ua_weights, k=1)[0]
        
        # Referrer (30% direct traffic)
        referrer = random.choice(REFERRERS)
        
        # Geo data with realistic distribution
        country, region, city = random.choices(COUNTRIES, weights=geo_weights, k=1)[0]
        
        # Parse device info from user agent (realistic distribution)
        if "iPhone" in user_agent or "Android" in user_agent or "Mobile" in user_agent:
            device_type = "Mobile"
            if "iPhone" in user_agent or "Safari" in user_agent and "Mobile" in user_agent:
                browser = "Safari"
                os = "iOS" if "iPhone" in user_agent else "Android"
            else:
                browser = "Chrome"
                os = "Android"
        elif "iPad" in user_agent:
            device_type = "Tablet"
            browser = "Safari"
            os = "iOS"
        else:
            device_type = "Desktop"
            if "Chrome" in user_agent and "Edg" in user_agent:
                browser = "Edge"
            elif "Firefox" in user_agent:
                browser = "Firefox"
            elif "Safari" in user_agent and "Chrome" not in user_agent:
                browser = "Safari"
            else:
                browser = "Chrome"
            
            if "Windows" in user_agent:
                os = "Windows"
            elif "Macintosh" in user_agent:
                os = "macOS"
            else:
                os = "Linux"
        
        click = Click(
            url_id=url.id,
            timestamp=timestamp,
            ip_address=ip_address,
            user_agent_raw=user_agent,
            referrer=referrer,
            country=country,
            region=region,
            city=city,
            browser=browser,
            os=os,
            device=device_type
        )
        
        clicks.append(click)
        
        # Update URL click count
        url.clicks += 1
        
        # Commit in batches
        if (i + 1) % 50 == 0:
            db.bulk_save_objects(clicks)
            db.commit()
            clicks = []
            print(f"Created {i + 1}/{count} clicks...")
    
    # Commit remaining clicks
    if clicks:
        db.bulk_save_objects(clicks)
        db.commit()
    
    print(f"✓ Created {count} clicks with realistic distributions")
    
    # Report top URLs by clicks
    top_urls = sorted(urls, key=lambda u: u.clicks, reverse=True)[:5]
    print(f"\nTop 5 URLs by clicks:")
    for idx, url in enumerate(top_urls, 1):
        print(f"  {idx}. {url.key}: {url.clicks} clicks")


def clear_tables(db: Session) -> None:
    """Delete all rows from clicks and urls tables."""
    try:
        # Delete clicks first (foreign key constraint)
        clicks_deleted = db.query(Click).delete()
        print(f"✓ Deleted {clicks_deleted} existing clicks")
        
        # Delete URLs
        urls_deleted = db.query(URL).delete()
        print(f"✓ Deleted {urls_deleted} existing URLs")
        
        db.commit()
    except Exception as e:
        print(f"✗ Error clearing tables: {e}")
        db.rollback()
        raise


def seed_pricing_plans(db):
    """Seed pricing plans if table is empty."""
    if db.query(PricingPlan).first():
        print("Pricing plans already exist, skipping")
        return
    plans = [
        PricingPlan(
            slug="starter",
            display_name="Starter",
            description="Perfect for individuals and small projects",
            price_monthly=0,
            price_yearly=0,
            currency="INR",
            features=[
                "Up to 20 shortened links",
                "5 QR codes",
                "5 custom links",
                "Basic click analytics",
                "Email support"
            ],
            limits={"links": 20, "qr_codes": 5, "custom_links": 5},
            is_popular=False,
            sort_order=1,
            is_active=True
        ),
        PricingPlan(
            slug="pro",
            display_name="Pro",
            description="For growing teams and professionals",
            price_monthly=299,
            price_yearly=2990,
            currency="INR",
            features=[
                "Up to 150 shortened links",
                "25 QR codes",
                "Unlimited custom links",
                "Advanced analytics",
                "Edit & expire links",
                "Priority support"
            ],
            limits={"links": 150, "qr_codes": 25, "custom_links": -1},
            is_popular=True,
            sort_order=2,
            is_active=True
        ),
        PricingPlan(
            slug="business",
            display_name="Business",
            description="For enterprises and high-volume usage",
            price_monthly=999,
            price_yearly=9990,
            currency="INR",
            features=[
                "Up to 1,000 shortened links",
                "100 QR codes",
                "Unlimited custom links",
                "Detailed geo analytics",
                "Device tracking",
                "Dedicated support"
            ],
            limits={"links": 1000, "qr_codes": 100, "custom_links": -1},
            is_popular=False,
            sort_order=3,
            is_active=True
        ),
        PricingPlan(
            slug="enterprise",
            display_name="Enterprise",
            description="Custom solutions for large organizations",
            price_monthly=0,
            price_yearly=0,
            currency="INR",
            features=[
                "Unlimited links & QR codes",
                "All Business features",
                "Custom integrations",
                "SLA guarantee",
                "Account manager"
            ],
            limits={"links": -1, "qr_codes": -1, "custom_links": -1},
            is_popular=False,
            sort_order=4,
            is_active=True
        ),
    ]
    for p in plans:
        db.add(p)
    db.commit()
    print(f"Seeded {len(plans)} pricing plans")


def seed_database():
    """Main seeding function."""
    db = SessionLocal()
    
    try:
        print("Starting database seeding...")
        print("-" * 50)
        
        # Clear existing data
        print("\nSeeding pricing plans...")
        seed_pricing_plans(db)
        print("-" * 50)
        print("\nClearing existing data...")
        clear_tables(db)
        print("-" * 50)
        
        # Configuration
        USER_ID = 2  # Existing user ID
        URL_COUNT = 120
        CLICK_COUNT = 2000
        
        # Verify user exists
        from models import User
        user = db.query(User).filter(User.id == USER_ID).first()
        if not user:
            print(f"✗ Error: User with ID {USER_ID} not found")
            return
        
        print(f"✓ Found user: {user.email}")
        print("-" * 50)
        
        # Create URLs
        print(f"\nGenerating {URL_COUNT} URLs...")
        urls = create_urls(db, USER_ID, URL_COUNT)
        
        # Create Clicks
        print(f"\nGenerating {CLICK_COUNT} clicks...")
        create_clicks(db, urls, CLICK_COUNT)
        
        print("-" * 50)
        print("✓ Database seeding completed successfully!")
        print(f"  • {URL_COUNT} URLs created")
        print(f"  • {CLICK_COUNT} clicks created")
        print(f"  • Average clicks per URL: {CLICK_COUNT / URL_COUNT:.1f}")
        
    except Exception as e:
        print(f"✗ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
