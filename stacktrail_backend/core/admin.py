from django.contrib import admin
from .models import Organization, Assessment, ScanRun, ReportRun, Finding

admin.site.register(Organization)
admin.site.register(Assessment)
admin.site.register(ScanRun)
admin.site.register(ReportRun)
admin.site.register(Finding)
