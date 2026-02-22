"""
Custom CORS middleware that always adds CORS headers and handles OPTIONS preflight.
Use when django-cors-headers is not adding headers (e.g. behind a proxy or cold start).
"""
from django.conf import settings
from django.http import HttpResponse


def _normalize(origin: str) -> str:
    return (origin or "").strip().rstrip("/")


def _origin_allowed(origin: str) -> bool:
    origin = _normalize(origin)
    if not origin:
        return False
    if getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False):
        return True
    allowed = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
    return any(_normalize(a) == origin for a in allowed)


def _add_cors_headers(response, origin: str):
    if not origin or not _origin_allowed(origin):
        return
    response["Access-Control-Allow-Origin"] = origin
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "accept, authorization, content-type, origin"
    response["Access-Control-Expose-Headers"] = "content-type"
    response["Access-Control-Max-Age"] = "86400"


class CorsFixMiddleware:
    """Handle OPTIONS preflight and add CORS headers to every response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.META.get("HTTP_ORIGIN", "").strip()
        if request.method == "OPTIONS" and origin and _origin_allowed(origin):
            response = HttpResponse(status=204)
            _add_cors_headers(response, origin)
            return response
        response = self.get_response(request)
        if origin:
            _add_cors_headers(response, origin)
        return response
