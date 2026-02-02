import httpx
import time
from typing import Optional
from user_agents import parse
from logging_config import get_logger

# Module-specific logger
logger = get_logger(__name__)

# Default fallback values
DEFAULT_GEO_DATA = {"country": None, "region": None, "city": None}
LOCAL_GEO_DATA = {"country": "Local", "region": "Local", "city": "Local"}
DEFAULT_DEVICE_DATA = {"browser": "Unknown", "os": "Unknown", "device": "Unknown"}


def _is_local_ip(ip_address: str) -> bool:
    """Check if the IP address is a local/private address."""
    if not ip_address:
        return True
    return (
        ip_address.startswith("127.") or
        ip_address.startswith("192.168.") or
        ip_address.startswith("10.") or
        ip_address.startswith("172.16.") or
        ip_address.startswith("172.17.") or
        ip_address.startswith("172.18.") or
        ip_address.startswith("172.19.") or
        ip_address.startswith("172.20.") or
        ip_address.startswith("172.21.") or
        ip_address.startswith("172.22.") or
        ip_address.startswith("172.23.") or
        ip_address.startswith("172.24.") or
        ip_address.startswith("172.25.") or
        ip_address.startswith("172.26.") or
        ip_address.startswith("172.27.") or
        ip_address.startswith("172.28.") or
        ip_address.startswith("172.29.") or
        ip_address.startswith("172.30.") or
        ip_address.startswith("172.31.") or
        ip_address == "::1" or
        ip_address == "localhost"
    )


def get_geolocation_for_ip(
    ip_address: str,
    max_retries: int = 2,
    base_timeout: float = 5.0
) -> dict:
    """
    Fetches geolocation data for a given IP address using the ip-api.com service.
    Includes retry logic with exponential backoff and rate limit handling.
    
    Args:
        ip_address: The IP address to look up
        max_retries: Maximum number of retry attempts
        base_timeout: Base timeout for HTTP requests
    
    Returns:
        Dictionary with country, region, and city
    """
    if _is_local_ip(ip_address):
        logger.debug(
            f"Local IP address detected, skipping geolocation",
            extra={'extra_data': {'ip_address': ip_address}}
        )
        return LOCAL_GEO_DATA

    api_url = f"http://ip-api.com/json/{ip_address}"
    last_error = None
    
    for attempt in range(1, max_retries + 1):
        try:
            logger.debug(
                f"Fetching geolocation for IP",
                extra={'extra_data': {'ip_address': ip_address, 'attempt': attempt}}
            )
            
            timeout = base_timeout * attempt  # Increase timeout on retries
            
            with httpx.Client(timeout=timeout) as client:
                response = client.get(api_url)
                
                # Handle rate limiting (HTTP 429)
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    logger.warning(
                        f"Rate limited by ip-api.com",
                        extra={'extra_data': {
                            'ip_address': ip_address,
                            'retry_after': retry_after
                        }}
                    )
                    # Don't wait too long, just return default
                    if retry_after > 10:
                        return DEFAULT_GEO_DATA
                    time.sleep(min(retry_after, 5))
                    continue
                
                response.raise_for_status()
                data = response.json()

                if data.get("status") == "success":
                    result = {
                        "country": data.get("country"),
                        "region": data.get("regionName"),
                        "city": data.get("city"),
                    }
                    logger.debug(
                        f"Geolocation retrieved successfully",
                        extra={'extra_data': {
                            'ip_address': ip_address,
                            'country': result.get('country')
                        }}
                    )
                    return result
                else:
                    logger.warning(
                        f"Geolocation API returned failure status",
                        extra={'extra_data': {
                            'ip_address': ip_address,
                            'api_message': data.get('message', 'unknown')
                        }}
                    )
                    return DEFAULT_GEO_DATA
                    
        except httpx.TimeoutException as e:
            last_error = e
            logger.warning(
                f"Geolocation request timed out",
                extra={'extra_data': {
                    'ip_address': ip_address,
                    'attempt': attempt,
                    'timeout': timeout
                }}
            )
        except httpx.HTTPStatusError as e:
            last_error = e
            logger.warning(
                f"HTTP error fetching geolocation",
                extra={'extra_data': {
                    'ip_address': ip_address,
                    'status_code': e.response.status_code,
                    'attempt': attempt
                }}
            )
        except httpx.RequestError as e:
            last_error = e
            logger.warning(
                f"Network error fetching geolocation",
                extra={'extra_data': {
                    'ip_address': ip_address,
                    'error_type': type(e).__name__,
                    'attempt': attempt
                }}
            )
        except Exception as e:
            last_error = e
            logger.error(
                f"Unexpected error during geolocation lookup",
                extra={'extra_data': {
                    'ip_address': ip_address,
                    'error_type': type(e).__name__,
                    'error': str(e)
                }},
                exc_info=True
            )
            return DEFAULT_GEO_DATA
        
        # Brief pause before retry
        if attempt < max_retries:
            time.sleep(0.5 * attempt)
    
    logger.warning(
        f"Failed to fetch geolocation after {max_retries} attempts",
        extra={'extra_data': {
            'ip_address': ip_address,
            'final_error': str(last_error)
        }}
    )
    return DEFAULT_GEO_DATA


def parse_user_agent(user_agent_string: Optional[str]) -> dict:
    """
    Parses a User-Agent string to extract browser, OS, and device information.
    Handles malformed or missing user agent strings gracefully.
    
    Args:
        user_agent_string: The User-Agent string to parse
    
    Returns:
        Dictionary with browser, os, and device type
    """
    # Handle None or empty user agent
    if not user_agent_string or not isinstance(user_agent_string, str):
        logger.debug(
            f"Empty or invalid user agent string",
            extra={'extra_data': {'user_agent_type': type(user_agent_string).__name__}}
        )
        return DEFAULT_DEVICE_DATA
    
    # Truncate excessively long user agents (potential attack)
    if len(user_agent_string) > 1000:
        logger.warning(
            f"User agent string exceeds maximum length, truncating",
            extra={'extra_data': {'original_length': len(user_agent_string)}}
        )
        user_agent_string = user_agent_string[:1000]
    
    try:
        user_agent = parse(user_agent_string)
        
        # Determine device type
        device_type = "Desktop"
        if user_agent.is_mobile:
            device_type = "Mobile"
        elif user_agent.is_tablet:
            device_type = "Tablet"
        elif user_agent.is_bot:
            device_type = "Bot"
        
        result = {
            "browser": user_agent.browser.family or "Unknown",
            "os": user_agent.os.family or "Unknown",
            "device": device_type,
        }
        
        logger.debug(
            f"User agent parsed successfully",
            extra={'extra_data': result}
        )
        
        return result
        
    except Exception as e:
        logger.warning(
            f"Failed to parse user agent string",
            extra={'extra_data': {
                'error_type': type(e).__name__,
                'error': str(e),
                'user_agent_preview': user_agent_string[:100] if user_agent_string else None
            }}
        )
        return DEFAULT_DEVICE_DATA
