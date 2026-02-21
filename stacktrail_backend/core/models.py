"""
StackTrail – Data models.
Organization, Assessment, ScanRun, ReportRun, Finding.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class Organization(models.Model):
    class BusinessType(models.TextChoices):
        LAW_FIRM = "law_firm", "Law firm"
        MEDICAL = "medical", "Medical practice"
        STARTUP = "startup", "Startup / SaaS"
        RETAIL = "retail", "Retail"
        ACCOUNTING = "accounting", "Accounting"
        REAL_ESTATE = "real_estate", "Real estate"
        CONSULTING = "consulting", "Consulting / agency"
        CONSTRUCTION = "construction", "Construction / contractor"
        NONPROFIT = "nonprofit", "Nonprofit"
        OTHER = "other", "Other"

    class WorkStyle(models.TextChoices):
        IN_OFFICE = "in_office", "Mostly in-office"
        HYBRID = "hybrid", "Hybrid"
        REMOTE = "remote", "Mostly remote"

    class RevenueRange(models.TextChoices):
        LT_250K = "lt_250k", "< $250k"
        R250_1M = "250k_1m", "$250k – $1M"
        R1_5M = "1m_5m", "$1M – $5M"
        GT_5M = "gt_5m", "> $5M"

    class DowntimeImpact(models.TextChoices):
        MINOR = "minor", "Minor inconvenience"
        LOSE_MONEY = "lose_money", "We miss deadlines / lose money"
        CANT_OPERATE = "cant_operate", "We can't operate"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="organizations"
    )
    name = models.CharField(max_length=255)
    business_type = models.CharField(
        max_length=32, choices=BusinessType.choices, default=BusinessType.OTHER
    )
    employee_count = models.PositiveIntegerField(default=1)
    revenue_range = models.CharField(
        max_length=32, choices=RevenueRange.choices, default=RevenueRange.LT_250K
    )
    work_style = models.CharField(
        max_length=32, choices=WorkStyle.choices, default=WorkStyle.IN_OFFICE
    )
    downtime_impact = models.CharField(
        max_length=32,
        choices=DowntimeImpact.choices,
        default=DowntimeImpact.LOSE_MONEY,
    )
    primary_domain = models.CharField(max_length=255)
    saas_stack = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # Optional: default assignee for tickets (Trello member ID or Jira account ID)
    default_assignee_id = models.CharField(max_length=128, blank=True)

    def __str__(self):
        return self.name


class Assessment(models.Model):
    class InsuranceReadiness(models.TextChoices):
        NOT_READY = "not_ready", "Not Ready"
        BASELINE = "baseline", "Baseline"
        STRONG = "strong", "Strong"

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="assessments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    answers = models.JSONField(default=dict, blank=True)
    score = models.PositiveIntegerField(default=0)
    risk_band = models.CharField(max_length=32, default="Unknown")
    breach_cost_low = models.PositiveIntegerField(default=0)
    breach_cost_high = models.PositiveIntegerField(default=0)
    downtime_days_low = models.PositiveIntegerField(default=0)
    downtime_days_high = models.PositiveIntegerField(default=0)
    insurance_readiness = models.CharField(
        max_length=32,
        choices=InsuranceReadiness.choices,
        default=InsuranceReadiness.NOT_READY,
    )
    # Per-question notes: {"mfa_all": "Rolling out next quarter", ...}
    checklist_notes = models.JSONField(default=dict, blank=True)

    def mark_completed(self):
        self.completed_at = timezone.now()
        self.save(update_fields=["completed_at"])


class OrgIntegration(models.Model):
    """Trello, Jira, Google Workspace (Tasks) – credentials and config per org."""
    class Provider(models.TextChoices):
        TRELLO = "trello", "Trello"
        JIRA = "jira", "Jira"
        GOOGLE_TASKS = "google_tasks", "Google Workspace (Tasks)"

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="integrations"
    )
    provider = models.CharField(max_length=32, choices=Provider.choices)
    # Provider-specific: Trello: api_key, token, list_id; Jira: domain, email, api_token, project_key
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("organization", "provider")]


class ScanRun(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="scan_runs"
    )
    scanned_at = models.DateTimeField(auto_now_add=True)
    dns_results = models.JSONField(default=dict, blank=True)
    email_auth_results = models.JSONField(default=dict, blank=True)
    tls_results = models.JSONField(default=dict, blank=True)
    website_headers = models.JSONField(default=dict, blank=True)
    overall_scan_status = models.CharField(max_length=32, default="pending")


class ReportRun(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="report_runs"
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    linked_assessment = models.ForeignKey(
        Assessment, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports"
    )
    linked_scan = models.ForeignKey(
        ScanRun, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports"
    )
    summary = models.TextField(blank=True)
    top_risks = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)


class Finding(models.Model):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class Category(models.TextChoices):
        IDENTITY = "identity", "Identity"
        EMAIL = "email", "Email"
        BACKUPS = "backups", "Backups"
        DEVICES = "devices", "Devices"
        TRAINING = "training", "Training"
        DATA_ACCESS = "data_access", "Data Access"
        PLANNING = "planning", "Planning"
        PAYMENTS = "payments", "Payments"

    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="findings"
    )
    key = models.CharField(max_length=64)
    title = models.CharField(max_length=255)
    severity = models.CharField(max_length=16, choices=Severity.choices)
    category = models.CharField(max_length=32, choices=Category.choices)
    impact = models.CharField(max_length=255)
    time_to_fix_minutes = models.PositiveIntegerField()
    estimated_risk_reduction_pct = models.PositiveIntegerField()
    explanation = models.TextField()
    remediation_steps = models.JSONField(default=list, blank=True)
    priority_score = models.FloatField(default=0.0)

    class Meta:
        ordering = ["-priority_score"]
