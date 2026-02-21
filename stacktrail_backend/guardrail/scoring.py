"""
Guardrail scoring engine. Start at 100, subtract weighted penalties.
Apply business-type and downtime multipliers. Risk bands 85–100 Low, 70–84 Moderate, 50–69 High, <50 Critical.
Insurance: Not Ready if MFA=no OR backups=no OR no incident plan; Baseline if MFA+backups; Strong if + no shared + restore test + incident plan.
"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple

from core.models import Assessment, Finding, Organization


PENALTIES: Dict[str, int] = {
    "mfa_all": 15,
    "admin_protection": 8,
    "shared_logins": 12,
    "mfa_payments": 10,
    "email_forwarding": 6,
    "file_sharing_limited": 8,
    "access_review": 6,
    "independent_backups": 12,
    "restore_tested": 8,
    "phishing_training": 6,
    "incident_plan": 10,
    "domain_email_protection": 10,
}

INDUSTRY_MULTIPLIERS: Dict[str, List[str]] = {
    "law_firm": ["mfa_all", "domain_email_protection", "independent_backups", "access_review"],
    "medical": ["mfa_all", "independent_backups", "access_review", "domain_email_protection"],
    "retail": ["mfa_payments", "shared_logins", "independent_backups"],
}

DOWNTIME_MULTIPLIER_KEYS: List[str] = ["independent_backups", "restore_tested", "incident_plan"]


def _multiplier(org: Organization, key: str) -> float:
    m = 1.0
    keys = INDUSTRY_MULTIPLIERS.get(org.business_type, [])
    if key in keys:
        m += 0.3
    if org.downtime_impact == Organization.DowntimeImpact.CANT_OPERATE and key in DOWNTIME_MULTIPLIER_KEYS:
        m += 0.3
    return m


def _score_answers(org: Organization, answers: Dict[str, Any]) -> Tuple[int, Dict[str, float]]:
    total_penalty = 0.0
    multipliers_used = {}
    for key, weight in PENALTIES.items():
        mult = _multiplier(org, key)
        multipliers_used[key] = mult
        val = answers.get(key)
        if val in ("yes", "enforced", "partial"):
            if val == "partial":
                total_penalty += weight * mult * 0.5
        else:
            total_penalty += weight * mult
    raw = max(0, 100 - int(total_penalty))
    return min(100, raw), multipliers_used


def _risk_band(score: int) -> str:
    if score >= 85:
        return "Low"
    if score >= 70:
        return "Moderate"
    if score >= 50:
        return "High"
    return "Critical"


def _insurance_readiness(answers: Dict[str, Any]) -> str:
    mfa = answers.get("mfa_all") in ("yes", "enforced", "partial")
    backups = answers.get("independent_backups") in ("yes", "partial")
    plan = answers.get("incident_plan") == "yes"
    if not mfa or not backups or not plan:
        return Assessment.InsuranceReadiness.NOT_READY
    shared = answers.get("shared_logins") != "yes"
    restore = answers.get("restore_tested") == "yes"
    if mfa and backups and shared and restore and plan:
        return Assessment.InsuranceReadiness.STRONG
    return Assessment.InsuranceReadiness.BASELINE


def _downtime_days(risk_band: str, downtime_impact: str) -> Tuple[int, int]:
    base = {"Low": (1, 2), "Moderate": (2, 4), "High": (4, 7), "Critical": (7, 14)}.get(risk_band, (3, 7))
    if downtime_impact == Organization.DowntimeImpact.CANT_OPERATE:
        return (base[0] + 1, base[1] + 3)
    if downtime_impact == Organization.DowntimeImpact.LOSE_MONEY:
        return base
    return (max(0, base[0] - 1), max(1, base[1] - 1))


def _daily_revenue(org: Organization) -> float:
    annual = {"lt_250k": 150_000, "250k_1m": 500_000, "1m_5m": 2_000_000, "gt_5m": 6_000_000}.get(
        org.revenue_range, 150_000
    )
    return annual / 260.0


def _breach_cost(org: Organization, risk_band: str) -> Tuple[int, int, int, int]:
    days_low, days_high = _downtime_days(risk_band, org.downtime_impact)
    daily = _daily_revenue(org)
    fixed = 10_000
    if org.employee_count > 15:
        fixed = 30_000
    cost_low = int(daily * days_low + fixed)
    cost_high = int(daily * days_high + fixed * 1.5)
    return cost_low, cost_high, days_low, days_high


FINDING_DEFS: Dict[str, tuple] = {
    "mfa_all": ("2-step login (MFA) for everyone", "high", "identity", "Account takeover risk", 120, 60, "MFA greatly reduces account takeover.", ["Enable MFA in your identity provider.", "Require it for all users."]),
    "admin_protection": ("Admin accounts protected", "high", "identity", "Privilege escalation risk", 90, 50, "Admins need extra protection.", ["Use separate admin accounts.", "Require MFA for admins."]),
    "shared_logins": ("No shared logins for critical systems", "high", "identity", "Unauditable access", 180, 55, "Shared logins prevent accountability.", ["Issue individual accounts.", "Use SSO or password manager for teams."]),
    "mfa_payments": ("MFA on payment platforms", "high", "payments", "Payment fraud risk", 60, 50, "Payment dashboards are high-value targets.", ["Turn on MFA in Stripe/Square/QuickBooks.", "Require for all approvers."]),
    "email_forwarding": ("Email forwarding restricted", "medium", "email", "Data exfiltration risk", 90, 35, "Unrestricted forwarding can leak mail.", ["Review forwarding rules in Google/Microsoft admin.", "Restrict or disable automatic forwarding."]),
    "file_sharing_limited": ("File sharing limited to organization", "medium", "data_access", "Data exposure", 120, 40, "External sharing increases leak risk.", ["Set sharing defaults to internal only.", "Review existing shared links."]),
    "access_review": ("Regular access review", "medium", "data_access", "Overprivileged users", 180, 35, "Regular reviews catch over-access.", ["Quarterly review of who has access to what.", "Remove access when roles change."]),
    "independent_backups": ("Independent backups outside SaaS", "high", "backups", "Data loss risk", 240, 60, "Relying only on provider backups is risky.", ["Use a backup tool (e.g. Backupify, Spanning).", "Verify backups are not in same tenant."]),
    "restore_tested": ("Restore tested recently", "medium", "backups", "Restore failure risk", 120, 40, "Untested backups often fail when needed.", ["Run a test restore at least every 6 months.", "Document the steps."]),
    "phishing_training": ("Phishing training for staff", "medium", "training", "Click-through risk", 120, 35, "Training reduces successful phishing.", ["Run quarterly phishing awareness.", "Use a short simulated phishing test."]),
    "incident_plan": ("Incident response plan", "high", "planning", "Chaos during incidents", 180, 45, "A plan reduces response time.", ["Write a one-page plan: who to call, what to do first.", "Share with key staff."]),
    "domain_email_protection": ("Domain email protection (SPF/DKIM/DMARC)", "medium", "email", "Spoofing and deliverability", 180, 45, "SPF/DKIM/DMARC reduce spoofing.", ["Add SPF, DKIM, and DMARC records at your DNS host.", "Start with DMARC policy none, then tighten."]),
}


def _create_findings(assessment: Assessment, answers: Dict[str, Any], multipliers: Dict[str, float]) -> None:
    Finding.objects.filter(assessment=assessment).delete()
    for key, (title, severity, category, impact, time_to_fix, risk_red, explanation, steps) in FINDING_DEFS.items():
        if answers.get(key) in ("yes", "enforced", "partial"):
            continue
        mult = multipliers.get(key, 1.0)
        priority = (3 if severity == "high" else 2 if severity == "medium" else 1) * risk_red * mult / max(1, time_to_fix)
        Finding.objects.create(
            assessment=assessment,
            key=key,
            title=title,
            severity=severity,
            category=category,
            impact=impact,
            time_to_fix_minutes=time_to_fix,
            estimated_risk_reduction_pct=risk_red,
            explanation=explanation,
            remediation_steps=steps,
            priority_score=priority,
        )


def score_assessment(assessment: Assessment, answers: Dict[str, Any]) -> None:
    org = assessment.organization
    score, multipliers = _score_answers(org, answers)
    band = _risk_band(score)
    insurance = _insurance_readiness(answers)
    cost_low, cost_high, days_low, days_high = _breach_cost(org, band)

    assessment.answers = answers
    assessment.score = score
    assessment.risk_band = band
    assessment.insurance_readiness = insurance
    assessment.breach_cost_low = cost_low
    assessment.breach_cost_high = cost_high
    assessment.downtime_days_low = days_low
    assessment.downtime_days_high = days_high
    assessment.save()

    _create_findings(assessment, answers, multipliers)
