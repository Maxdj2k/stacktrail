"""TLS: HTTPS, cert expiry, issuer, HTTP→HTTPS redirect."""
import ssl
import socket
from datetime import datetime, timezone
from typing import Any, Dict
import requests


def get_cert_info(hostname: str, port: int = 443, timeout: float = 5.0) -> Dict[str, Any]:
    out = {"valid": False, "expires": None, "issuer": None, "error": None}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                out["valid"] = True
                not_after = cert.get("notAfter")
                if not_after:
                    out["expires"] = not_after
                    try:
                        dt = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        out["days_until_expiry"] = (dt - datetime.now(timezone.utc)).days
                    except Exception:
                        pass
                issuer = cert.get("issuer")
                if issuer:
                    out["issuer"] = ", ".join(f"{k}={v}" for k, v in issuer)
    except Exception as e:
        out["error"] = str(e)
    return out


def check_https_redirect(domain: str, timeout: float = 5.0) -> Dict[str, Any]:
    out = {"https_ok": False, "redirects_to_https": False, "error": None}
    try:
        r = requests.get(f"https://{domain}", timeout=timeout, allow_redirects=True)
        out["https_ok"] = r.url.startswith("https://")
        r2 = requests.get(f"http://{domain}", timeout=timeout, allow_redirects=True)
        out["redirects_to_https"] = r2.url.startswith("https://")
    except Exception as e:
        out["error"] = str(e)
    return out


def run_tls_scan(domain: str) -> Dict[str, Any]:
    return {"cert": get_cert_info(domain), "redirect": check_https_redirect(domain)}
