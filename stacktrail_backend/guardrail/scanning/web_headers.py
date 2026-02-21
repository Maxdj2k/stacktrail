"""Security headers: HSTS, X-Content-Type-Options."""
from typing import Any, Dict
import requests


def run_headers_scan(domain: str, timeout: float = 5.0) -> Dict[str, Any]:
    out = {"hsts": False, "x_content_type_options": False, "headers": {}, "error": None}
    try:
        r = requests.get(f"https://{domain}", timeout=timeout)
        h = {k.lower(): v for k, v in r.headers.items()}
        out["headers"] = h
        out["hsts"] = "strict-transport-security" in h
        out["x_content_type_options"] = h.get("x-content-type-options", "").lower() == "nosniff"
    except Exception as e:
        out["error"] = str(e)
    return out
