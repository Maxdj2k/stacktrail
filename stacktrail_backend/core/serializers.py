from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Assessment, Finding, Organization, OrgIntegration, ReportRun, ScanRun

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "email", "username", "password")
        extra_kwargs = {"email": {"required": False}}

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class OrganizationSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.id")

    class Meta:
        model = Organization
        fields = (
            "id", "owner", "name", "business_type", "employee_count", "revenue_range",
            "work_style", "downtime_impact", "primary_domain", "saas_stack", "created_at",
            "default_assignee_id",
        )
        read_only_fields = ("created_at",)


class OrgIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgIntegration
        fields = ("id", "organization", "provider", "config", "created_at")
        read_only_fields = ("created_at",)
        extra_kwargs = {"organization": {"read_only": True}}


class AssessmentSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = Assessment
        fields = (
            "id", "organization", "created_at", "completed_at", "answers",
            "score", "risk_band", "breach_cost_low", "breach_cost_high",
            "downtime_days_low", "downtime_days_high", "insurance_readiness",
            "checklist_notes",
        )
        read_only_fields = (
            "created_at", "completed_at", "score", "risk_band",
            "breach_cost_low", "breach_cost_high", "downtime_days_low", "downtime_days_high",
            "insurance_readiness",
        )


class FindingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Finding
        fields = (
            "id", "key", "title", "severity", "category", "impact",
            "time_to_fix_minutes", "estimated_risk_reduction_pct", "explanation",
            "remediation_steps", "priority_score",
        )


class ScanRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanRun
        fields = (
            "id", "organization", "scanned_at", "dns_results", "email_auth_results",
            "tls_results", "website_headers", "overall_scan_status",
        )
        read_only_fields = ("scanned_at",)


class ReportRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRun
        fields = (
            "id", "organization", "generated_at", "linked_assessment", "linked_scan",
            "summary", "top_risks", "recommendations",
        )
        read_only_fields = ("generated_at",)
