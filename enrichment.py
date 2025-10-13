import httpx
from user_agents import parse


def get_geolocation_for_ip(ip_address: str) -> dict:
    """
    Fetches geolocation data for a given IP address using the ip-api.com service.
    """

    if ip_address.startswith("127.") or ip_address.startswith("192.168.") or ip_address.startswith("10."):
        return {"country": "Local", "region": "Local", "city": "Local"}

    api_url = f"http://ip-api.com/json/{ip_address}"
    try:
        with httpx.Client() as client:
            response = client.get(api_url)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "success":
                return {
                    "country": data.get("country"),
                    "region": data.get("regionName"),
                    "city": data.get("city"),
                }
            else:
                return {"country": None, "region": None, "city": None}
    except httpx.HTTPStatusError as e:
        print(f"HTTP error fetching geolocation: {e}")
        return {"country": None, "region": None, "city": None}
    except Exception as e:
        print(f"An error occurred during geolocation fetching: {e}")
        return {"country": None, "region": None, "city": None}


def parse_user_agent(user_agent_string: str) -> dict:
    """
    Parses a User-Agent string to extract browser, OS, and device information.
    """
    user_agent = parse(user_agent_string)

    device_type = "Desktop"
    if user_agent.is_mobile:
        device_type = "Mobile"
    elif user_agent.is_tablet:
        device_type = "Tablet"

    return {
        "browser": user_agent.browser.family,
        "os": user_agent.os.family,
        "device": device_type,
    }
