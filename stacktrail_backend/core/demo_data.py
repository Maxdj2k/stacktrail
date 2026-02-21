"""Shared demo org data for seed_demo command and seed-demo API."""
from .models import Organization

DEMO_ORGS = [
    {
        "name": "Demo Law Firm",
        "business_type": Organization.BusinessType.LAW_FIRM,
        "employee_count": 12,
        "revenue_range": Organization.RevenueRange.R1_5M,
        "work_style": Organization.WorkStyle.HYBRID,
        "downtime_impact": Organization.DowntimeImpact.LOSE_MONEY,
        "primary_domain": "example.com",
        "saas_stack": {
            "email_provider": "Google Workspace",
            "file_storage": "Google Drive",
            "payments_platform": "Stripe",
            "payroll_platform": "Gusto",
            "accounting_platform": "QuickBooks",
            "collaboration_tool": "Slack",
        },
        "answers": {
            "mfa_all": "yes",
            "admin_protection": "yes",
            "shared_logins": "no",
            "mfa_payments": "yes",
            "email_forwarding": "yes",
            "file_sharing_limited": "partial",
            "access_review": "yes",
            "independent_backups": "yes",
            "restore_tested": "yes",
            "phishing_training": "yes",
            "incident_plan": "yes",
            "domain_email_protection": "no",
        },
    },
    {
        "name": "Demo Medical Practice",
        "business_type": Organization.BusinessType.MEDICAL,
        "employee_count": 8,
        "revenue_range": Organization.RevenueRange.R250_1M,
        "work_style": Organization.WorkStyle.IN_OFFICE,
        "downtime_impact": Organization.DowntimeImpact.CANT_OPERATE,
        "primary_domain": "example.com",
        "saas_stack": {
            "email_provider": "Microsoft 365",
            "file_storage": "OneDrive",
            "payments_platform": "Square",
            "payroll_platform": "ADP",
            "accounting_platform": "QuickBooks",
            "collaboration_tool": "Teams",
        },
        "answers": {
            "mfa_all": "partial",
            "admin_protection": "no",
            "shared_logins": "no",
            "mfa_payments": "yes",
            "email_forwarding": "yes",
            "file_sharing_limited": "yes",
            "access_review": "no",
            "independent_backups": "no",
            "restore_tested": "no",
            "phishing_training": "no",
            "incident_plan": "no",
            "domain_email_protection": "no",
        },
    },
    {
        "name": "Demo Retail Shop",
        "business_type": Organization.BusinessType.RETAIL,
        "employee_count": 5,
        "revenue_range": Organization.RevenueRange.LT_250K,
        "work_style": Organization.WorkStyle.IN_OFFICE,
        "downtime_impact": Organization.DowntimeImpact.LOSE_MONEY,
        "primary_domain": "example.com",
        "saas_stack": {
            "email_provider": "Google Workspace",
            "file_storage": "Google Drive",
            "payments_platform": "Square",
            "payroll_platform": "Gusto",
            "accounting_platform": "QuickBooks",
            "collaboration_tool": "Slack",
        },
        "answers": {
            "mfa_all": "no",
            "admin_protection": "no",
            "shared_logins": "yes",
            "mfa_payments": "no",
            "email_forwarding": "yes",
            "file_sharing_limited": "no",
            "access_review": "no",
            "independent_backups": "no",
            "restore_tested": "no",
            "phishing_training": "no",
            "incident_plan": "no",
            "domain_email_protection": "no",
        },
    },
]


def seed_demo_for_user(user):
    """Create 3 demo orgs with scan + assessment for the given user. Returns list of orgs."""
    import copy
    from guardrail.scanning import run_scan
    from guardrail.scoring import score_assessment
    from .models import Assessment, Organization

    created_orgs = []
    for item in DEMO_ORGS:
        data = copy.deepcopy(item)
        answers = data.pop("answers")
        org, created = Organization.objects.get_or_create(
            owner=user,
            name=data["name"],
            defaults=data,
        )
        if created:
            created_orgs.append(org)
        run_scan(org)
        assessment = Assessment.objects.create(organization=org)
        score_assessment(assessment, answers)
        assessment.mark_completed()
    return created_orgs
