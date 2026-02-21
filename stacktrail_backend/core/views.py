from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, response, status, views
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from guardrail.scoring import score_assessment
from guardrail.scanning import run_scan

from .ai_suggestions import get_ai_suggestions_for_finding
from .demo_data import seed_demo_for_user
from .integrations import create_google_task, create_jira_issue, create_trello_card
from .models import Assessment, Finding, Organization, OrgIntegration, ReportRun, ScanRun

User = get_user_model()
DEMO_PASSWORD = "demo1234!"
from .serializers import (
    AssessmentSerializer,
    FindingSerializer,
    OrganizationSerializer,
    OrgIntegrationSerializer,
    RegisterSerializer,
    ReportRunSerializer,
    ScanRunSerializer,
)


class APIRootView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data = {
            "name": "StackTrail API",
            "description": "Cyber Checkup API for small businesses.",
            "endpoints": {
                "auth": {"register": "/api/auth/register", "login": "/api/auth/login"},
                "orgs": "/api/orgs",
                "assessments": "/api/assessments/start",
            },
        }
        return response.Response(data)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class SeedDemoView(views.APIView):
    """Create 3 demo organizations with scans and assessments for the current user."""

    def post(self, request):
        seed_demo_for_user(request.user)
        orgs = Organization.objects.filter(owner=request.user).order_by("-created_at")
        return response.Response(
            OrganizationSerializer(orgs, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class DashboardSummaryView(views.APIView):
    """Return orgs with latest assessment (score, risk_band, answers) for dashboard charts."""

    def get(self, request):
        orgs = Organization.objects.filter(owner=request.user).order_by("-created_at")
        out = []
        for org in orgs:
            latest = (
                Assessment.objects.filter(organization=org, completed_at__isnull=False)
                .order_by("-completed_at")
                .first()
            )
            item = {
                "id": org.id,
                "name": org.name,
                "primary_domain": org.primary_domain,
                "business_type": org.business_type,
            }
            if latest:
                item["latest_assessment"] = {
                    "score": latest.score,
                    "risk_band": latest.risk_band,
                    "answers": latest.answers or {},
                }
            else:
                item["latest_assessment"] = None
            out.append(item)
        return response.Response(out)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        if username == "demo" and password == DEMO_PASSWORD:
            user, created = User.objects.get_or_create(
                username="demo",
                defaults={"email": "demo@example.com"},
            )
            if created or not user.has_usable_password():
                user.set_password(DEMO_PASSWORD)
                user.save()
            if created:
                seed_demo_for_user(user)
            refresh = RefreshToken.for_user(user)
            return response.Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })
        return super().post(request, *args, **kwargs)


class OrganizationListCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationSerializer

    def get_queryset(self):
        return Organization.objects.filter(owner=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer

    def get_queryset(self):
        return Organization.objects.filter(owner=self.request.user)


class OrganizationScanView(views.APIView):
    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk, owner=request.user)
        scan = run_scan(org)
        return response.Response(
            ScanRunSerializer(scan).data,
            status=status.HTTP_201_CREATED,
        )


class OrganizationGenerateReportView(views.APIView):
    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk, owner=request.user)
        latest_assessment = org.assessments.filter(completed_at__isnull=False).order_by("-completed_at").first()
        latest_scan = org.scan_runs.order_by("-scanned_at").first()

        summary_parts = []
        top_risks = []
        recommendations = []

        if latest_assessment:
            summary_parts.append(f"Cyber Health Score: {latest_assessment.score}/100 ({latest_assessment.risk_band} risk).")
            top_findings = latest_assessment.findings.order_by("-priority_score")[:3]
            top_risks = [f.title for f in top_findings]
            recommendations = []
            for f in top_findings:
                recommendations.append({"title": f.title, "steps": f.remediation_steps})
        if latest_scan:
            summary_parts.append(f"Domain scan: {latest_scan.overall_scan_status}. SPF/DMARC/TLS checked.")

        report = ReportRun.objects.create(
            organization=org,
            linked_assessment=latest_assessment,
            linked_scan=latest_scan,
            summary=" ".join(summary_parts) or "No assessment or scan data yet.",
            top_risks=top_risks,
            recommendations=recommendations,
        )
        return response.Response(
            ReportRunSerializer(report).data,
            status=status.HTTP_201_CREATED,
        )


class AssessmentStartView(views.APIView):
    def post(self, request):
        org_id = request.data.get("organization_id")
        org = get_object_or_404(Organization, id=org_id, owner=request.user)
        assessment = Assessment.objects.create(organization=org)
        return response.Response(
            AssessmentSerializer(assessment).data,
            status=status.HTTP_201_CREATED,
        )


class AssessmentSubmitView(views.APIView):
    def post(self, request, pk):
        assessment = get_object_or_404(
            Assessment, pk=pk, organization__owner=request.user
        )
        answers = request.data.get("answers")
        if not isinstance(answers, dict):
            return response.Response(
                {"detail": "answers must be an object"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        score_assessment(assessment, answers)
        assessment.mark_completed()
        return response.Response(AssessmentSerializer(assessment).data)


class AssessmentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AssessmentSerializer

    def get_queryset(self):
        return Assessment.objects.filter(organization__owner=self.request.user)

    def perform_update(self, serializer):
        # Only allow updating checklist_notes
        if "checklist_notes" in self.request.data:
            serializer.save(checklist_notes=self.request.data["checklist_notes"])
        else:
            serializer.save()


class AssessmentFindingsView(generics.ListAPIView):
    serializer_class = FindingSerializer

    def get_queryset(self):
        return Finding.objects.filter(
            assessment_id=self.kwargs["pk"],
            assessment__organization__owner=self.request.user,
        )


class AssessmentAISuggestionsView(views.APIView):
    """Generate AI suggestions and tags for one or all checklist items (findings or question label)."""

    def post(self, request, pk):
        assessment = get_object_or_404(
            Assessment, pk=pk, organization__owner=request.user
        )
        finding_key = request.data.get("finding_key")
        question_label = request.data.get("question_label", "")
        findings = Finding.objects.filter(assessment=assessment).order_by("-priority_score")
        if finding_key:
            findings = findings.filter(key=finding_key)
        results = []
        for f in findings:
            note = (assessment.checklist_notes or {}).get(f.key, "")
            out = get_ai_suggestions_for_finding(
                title=f.title,
                explanation=f.explanation or "",
                remediation_steps=f.remediation_steps or [],
                extra_context=note,
            )
            results.append({
                "finding_key": f.key,
                "suggestions": out.get("suggestions") or [],
                "tags": out.get("tags") or [],
            })
        # Single checklist item with no finding: generate from question_label
        if finding_key and not results and question_label:
            out = get_ai_suggestions_for_finding(
                title=question_label,
                explanation="General cyber hygiene checklist item.",
                remediation_steps=[],
                extra_context="",
            )
            results.append({
                "finding_key": finding_key,
                "suggestions": out.get("suggestions") or [],
                "tags": out.get("tags") or [],
            })
        return response.Response(
            results[0] if finding_key and results else {"findings": results}
        )


class OrganizationAssessmentsView(generics.ListAPIView):
    serializer_class = AssessmentSerializer

    def get_queryset(self):
        return Assessment.objects.filter(
            organization_id=self.kwargs["pk"],
            organization__owner=self.request.user,
        ).order_by("-created_at")


class OrganizationScanRunsView(generics.ListAPIView):
    serializer_class = ScanRunSerializer

    def get_queryset(self):
        return ScanRun.objects.filter(
            organization_id=self.kwargs["pk"],
            organization__owner=self.request.user,
        ).order_by("-scanned_at")


class OrganizationReportRunsView(generics.ListAPIView):
    serializer_class = ReportRunSerializer

    def get_queryset(self):
        return ReportRun.objects.filter(
            organization_id=self.kwargs["pk"],
            organization__owner=self.request.user,
        ).order_by("-generated_at")


class OrganizationIntegrationsView(views.APIView):
    def get(self, request, pk):
        org = get_object_or_404(Organization, pk=pk, owner=request.user)
        integrations = OrgIntegration.objects.filter(organization=org)
        data = []
        for i in integrations:
            data.append({
                "id": i.id,
                "provider": i.provider,
                "connected": True,
                "config": {k: (v[:20] + "…" if k in ("api_token", "token", "access_token") and isinstance(v, str) and len(v) > 20 else v) for k, v in (i.config or {}).items()},
            })
        return response.Response(data)

    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk, owner=request.user)
        provider = request.data.get("provider")
        config = request.data.get("config") or {}
        if provider not in ("trello", "jira", "google_tasks"):
            return response.Response({"detail": "provider must be trello, jira, or google_tasks"}, status=status.HTTP_400_BAD_REQUEST)
        integration, _ = OrgIntegration.objects.update_or_create(
            organization=org,
            provider=provider,
            defaults={"config": config},
        )
        return response.Response({"id": integration.id, "provider": integration.provider, "connected": True}, status=status.HTTP_201_CREATED)


class CreateTicketView(views.APIView):
    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk, owner=request.user)
        provider = request.data.get("provider")
        assessment_id = request.data.get("assessment_id")
        finding_key = request.data.get("finding_key")
        if not provider or not assessment_id or not finding_key:
            return response.Response(
                {"detail": "provider, assessment_id, and finding_key are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assessment = get_object_or_404(Assessment, id=assessment_id, organization=org)
        finding = Finding.objects.filter(assessment=assessment, key=finding_key).first()
        if not finding:
            return response.Response({"detail": "finding not found"}, status=status.HTTP_404_NOT_FOUND)
        title = finding.title
        steps = list(finding.remediation_steps) if finding.remediation_steps else []
        note = (assessment.checklist_notes or {}).get(finding_key, "")
        desc = finding.explanation or ""
        if steps:
            desc += "\n\nTo-do:\n" + "\n".join(f"- {s}" for s in steps)
        if note:
            desc += "\n\nNotes: " + note
        ai_suggestions = request.data.get("ai_suggestions")
        if isinstance(ai_suggestions, list) and ai_suggestions:
            desc += "\n\nAI suggestions:\n" + "\n".join(f"- {s}" for s in ai_suggestions)

        integration = get_object_or_404(OrgIntegration, organization=org, provider=provider)
        config = integration.config or {}
        assignee = org.default_assignee_id or config.get("assignee_id") or config.get("member_id")

        try:
            if provider == "trello":
                list_id = config.get("list_id")
                if not list_id:
                    return response.Response({"detail": "Trello list_id required in integration config"}, status=status.HTTP_400_BAD_REQUEST)
                card = create_trello_card(
                    api_key=config.get("api_key", ""),
                    token=config.get("token", ""),
                    list_id=list_id,
                    name=title,
                    desc=desc,
                    member_id=assignee,
                )
                return response.Response({"url": card.get("url"), "id": card.get("id")}, status=status.HTTP_201_CREATED)
            if provider == "jira":
                project_key = config.get("project_key")
                if not project_key:
                    return response.Response({"detail": "Jira project_key required in integration config"}, status=status.HTTP_400_BAD_REQUEST)
                issue = create_jira_issue(
                    domain=config.get("domain", "").rstrip("/"),
                    email=config.get("email", ""),
                    api_token=config.get("api_token", ""),
                    project_key=project_key,
                    summary=title,
                    description=desc,
                    assignee_id=assignee,
                )
                key = issue.get("key")
                return response.Response(
                    {"key": key, "url": f"{config.get('domain', '').rstrip('/')}/browse/{key}"},
                    status=status.HTTP_201_CREATED,
                )
            if provider == "google_tasks":
                task_list_id = config.get("task_list_id")
                access_token = config.get("access_token")
                if not task_list_id or not access_token:
                    return response.Response(
                        {"detail": "Google Tasks task_list_id and access_token required in integration config"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                task = create_google_task(
                    access_token=access_token,
                    task_list_id=task_list_id,
                    title=title,
                    notes=desc,
                )
                return response.Response(
                    {"id": task.get("id"), "url": task.get("self")},
                    status=status.HTTP_201_CREATED,
                )
            return response.Response({"detail": "unknown provider"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return response.Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class MockGoogleWorkspaceTagView(views.APIView):
    """Mock API: simulate creating Google Workspace tags/labels with suggestions (for demo)."""

    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk, owner=request.user)
        finding_key = request.data.get("finding_key", "")
        tags = request.data.get("tags") or []
        suggestions = request.data.get("suggestions") or []
        if not isinstance(tags, list):
            tags = []
        if not isinstance(suggestions, list):
            suggestions = []
        tags = [str(t) for t in tags][:10]
        suggestions = [str(s) for s in suggestions][:20]
        # Simulate success; no real Google API call
        tag_list = ", ".join(tags) if tags else "General"
        msg = f"Created tags: {tag_list} in Google Workspace (demo)."
        if suggestions:
            msg += " Suggestions attached to each tag."
        return response.Response({"success": True, "message": msg}, status=status.HTTP_200_OK)


class RunWorkflowView(views.APIView):
    """Workflow automation: create tickets/cards for all findings across connected integrations."""

    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk, owner=request.user)
        assessment_id = request.data.get("assessment_id")
        include_ai = request.data.get("include_ai_suggestions", True)
        if not assessment_id:
            return response.Response(
                {"detail": "assessment_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assessment = get_object_or_404(Assessment, id=assessment_id, organization=org)
        findings = list(Finding.objects.filter(assessment=assessment).order_by("-priority_score"))
        if not findings:
            return response.Response({"created": [], "errors": [], "message": "No findings for this assessment."})

        integrations = list(OrgIntegration.objects.filter(organization=org))
        if not integrations:
            return response.Response(
                {"detail": "Connect at least one integration (Trello, Jira, or Google Workspace) first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        errors = []
        configs = {i.provider: (i, i.config or {}) for i in integrations}
        assignee = org.default_assignee_id

        for finding in findings:
            steps = list(finding.remediation_steps or [])
            note = (assessment.checklist_notes or {}).get(finding.key, "")
            desc = finding.explanation or ""
            if steps:
                desc += "\n\nTo-do:\n" + "\n".join(f"- {s}" for s in steps)
            if note:
                desc += "\n\nNotes: " + note
            if include_ai:
                out = get_ai_suggestions_for_finding(
                    title=finding.title,
                    explanation=finding.explanation or "",
                    remediation_steps=steps,
                    extra_context=note,
                )
                ai_list = out.get("suggestions") or []
                if ai_list:
                    desc += "\n\nAI suggestions:\n" + "\n".join(f"- {s}" for s in ai_list)

            for provider, (integration, config) in configs.items():
                assignee_id = assignee or config.get("assignee_id") or config.get("member_id")
                try:
                    if provider == "trello":
                        list_id = config.get("list_id")
                        if not list_id:
                            errors.append({"provider": provider, "finding_key": finding.key, "detail": "list_id required"})
                            continue
                        card = create_trello_card(
                            api_key=config.get("api_key", ""),
                            token=config.get("token", ""),
                            list_id=list_id,
                            name=finding.title,
                            desc=desc,
                            member_id=assignee_id,
                        )
                        created.append({"provider": provider, "finding_key": finding.key, "url": card.get("url"), "id": card.get("id")})
                    elif provider == "jira":
                        project_key = config.get("project_key")
                        if not project_key:
                            errors.append({"provider": provider, "finding_key": finding.key, "detail": "project_key required"})
                            continue
                        issue = create_jira_issue(
                            domain=config.get("domain", "").rstrip("/"),
                            email=config.get("email", ""),
                            api_token=config.get("api_token", ""),
                            project_key=project_key,
                            summary=finding.title,
                            description=desc,
                            assignee_id=assignee_id,
                        )
                        key = issue.get("key")
                        created.append({"provider": provider, "finding_key": finding.key, "key": key, "url": f"{config.get('domain', '').rstrip('/')}/browse/{key}"})
                    elif provider == "google_tasks":
                        task_list_id = config.get("task_list_id")
                        access_token = config.get("access_token")
                        if not task_list_id or not access_token:
                            errors.append({"provider": provider, "finding_key": finding.key, "detail": "task_list_id and access_token required"})
                            continue
                        task = create_google_task(
                            access_token=access_token,
                            task_list_id=task_list_id,
                            title=finding.title,
                            notes=desc,
                        )
                        created.append({"provider": provider, "finding_key": finding.key, "id": task.get("id")})
                except Exception as e:
                    errors.append({"provider": provider, "finding_key": finding.key, "detail": str(e)})

        return response.Response({"created": created, "errors": errors}, status=status.HTTP_200_OK)
