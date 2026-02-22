from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from core.views import LoginView, RegisterView

urlpatterns = [
    path("", RedirectView.as_view(url="/api/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    # Allow /auth/login and /auth/register (same as /api/auth/...) so old frontends work
    path("auth/login", LoginView.as_view()),
    path("auth/register", RegisterView.as_view()),
]
