"""DNS and email auth: MX, SPF, DMARC, optional DKIM heuristic."""
from typing import Any, Dict

try:
    import dns.resolver
    import dns.exception
    HAS_DNS = True
except ImportError:
    HAS_DNS = False


def check_mx(domain: str) -> Dict[str, Any]:
    out = {"present": False, "hosts": [], "error": None}
    if not HAS_DNS:
        out["error"] = "dnspython not installed"
        return out
    try:
        answers = dns.resolver.resolve(domain, "MX")
        out["present"] = True
        out["hosts"] = [str(r.exchange).rstrip(".") for r in answers]
    except dns.exception.DNSException as e:
        out["error"] = str(e)
    return out


def check_txt(domain: str, prefix: str) -> Dict[str, Any]:
    out = {"present": False, "records": [], "error": None}
    if not HAS_DNS:
        out["error"] = "dnspython not installed"
        return out
    try:
        answers = dns.resolver.resolve(domain, "TXT")
        for r in answers:
            s = "".join(chunk.decode() if isinstance(chunk, bytes) else str(chunk) for chunk in r.strings)
            if s.strip().startswith(prefix):
                out["present"] = True
                out["records"].append(s[:500])
    except dns.exception.DNSException as e:
        out["error"] = str(e)
    return out


def check_spf(domain: str) -> Dict[str, Any]:
    return check_txt(domain, "v=spf1")


def check_dmarc(domain: str) -> Dict[str, Any]:
    return check_txt(f"_dmarc.{domain}", "v=DMARC1")


def check_dkim_heuristic(domain: str, selector: str = "default") -> Dict[str, Any]:
    sub = f"{selector}._domainkey.{domain}"
    out = {"present": False, "selector": selector, "error": None}
    if not HAS_DNS:
        out["error"] = "dnspython not installed"
        return out
    try:
        answers = dns.resolver.resolve(sub, "TXT")
        if answers:
            out["present"] = True
    except dns.exception.DNSException:
        pass
    return out


def run_dns_scan(domain: str) -> Dict[str, Any]:
    return {
        "mx": check_mx(domain),
        "spf": check_spf(domain),
        "dmarc": check_dmarc(domain),
        "dkim_heuristic": check_dkim_heuristic(domain),
    }
