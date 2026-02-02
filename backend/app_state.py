from datetime import timedelta
from config import settings

# In-memory cache for click deduplication
RECENT_CLICKS_CACHE = {}
DEDUPLICATION_TIMEDELTA = timedelta(
    seconds=settings.CLICK_DEDUPLICATION_WINDOW_SECONDS)
