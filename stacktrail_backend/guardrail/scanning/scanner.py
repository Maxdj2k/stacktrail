"""Run DNS + TLS + headers; create ScanRun."""
from core.models import Organization, ScanRun
from .dns_scan import run_dns_scan
from .tls_scan import run_tls_scan
from .web_headers import run_headers_scan


def run_scan(org: Organization) -> ScanRun:
    domain = (org.primary_domain or "example.com").strip()
    dns_results = run_dns_scan(domain)
    tls_results = run_tls_scan(domain)
    website_headers = run_headers_scan(domain)

    issues = []
    if not dns_results.get("spf", {}).get("present") and not dns_results.get("spf", {}).get("error"):
        issues.append("no_spf")
    if not dns_results.get("dmarc", {}).get("present") and not dns_results.get("dmarc", {}).get("error"):
        issues.append("no_dmarc")
    if not tls_results.get("cert", {}).get("valid"):
        issues.append("tls_invalid")
    if tls_results.get("cert", {}).get("days_until_expiry", 999) is not None and tls_results["cert"].get("days_until_expiry", 999) < 30:
        issues.append("cert_expiring_soon")
    if not website_headers.get("hsts"):
        issues.append("no_hsts")

    if not issues:
        overall_scan_status = "ok"
    elif "tls_invalid" in issues or "no_spf" in issues:
        overall_scan_status = "error"
    else:
        overall_scan_status = "warning"

    scan = ScanRun.objects.create(
        organization=org,
        dns_results=dns_results,
        email_auth_results={"spf": dns_results.get("spf"), "dmarc": dns_results.get("dmarc"), "dkim": dns_results.get("dkim_heuristic")},
        tls_results=tls_results,
        website_headers=website_headers,
        overall_scan_status=overall_scan_status,
    )
    return scan
