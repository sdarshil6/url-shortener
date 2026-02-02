import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI


from app_state import RECENT_CLICKS_CACHE, DEDUPLICATION_TIMEDELTA


async def cleanup_cache_periodically():
    """A background task that runs forever, cleaning the cache every hour."""
    while True:
        try:
            message = "BACKGROUND TASK: Running cache cleanup..."
            print(message)
            logging.info(message)

            cutoff_time = datetime.utcnow() - (DEDUPLICATION_TIMEDELTA * 10)

            items_to_check = list(RECENT_CLICKS_CACHE.items())

            for key, timestamp in items_to_check:
                if timestamp < cutoff_time:
                    del RECENT_CLICKS_CACHE[key]

            final_message = f"BACKGROUND TASK: Cleanup finished. Cache size: {len(RECENT_CLICKS_CACHE)}"
            print(final_message)
            logging.info(final_message)

        except Exception as e:
            logging.error(f"Error in cache cleanup task: {e}", exc_info=True)

        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup and shutdown events."""
    print("Application startup: Starting background cache cleanup task...")
    logging.info(
        "Application startup: Starting background cache cleanup task...")
    cleanup_task = asyncio.create_task(cleanup_cache_periodically())
    yield
    print("Application shutdown: Stopping background task...")
    logging.info("Application shutdown: Stopping background task...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        logging.info("Background task was successfully cancelled.")
