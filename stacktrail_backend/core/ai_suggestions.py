"""AI-generated cyber hygiene suggestions and tags for findings."""
import json
import logging
import os

logger = logging.getLogger(__name__)


def get_ai_suggestions_for_finding(
    title: str,
    explanation: str,
    remediation_steps: list,
    extra_context: str = "",
) -> dict:
    """Call OpenAI to return suggestions and Google Workspace–style tags for a finding.
    Returns {"suggestions": list[str], "tags": list[str]}."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set; AI suggestions disabled. Set it in .env or environment.")
        return {"suggestions": [], "tags": []}

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        steps_text = "\n".join(f"- {s}" for s in (remediation_steps or []))
        prompt = f"""You are a cyber hygiene advisor for small businesses. Given this checklist item, do two things:

1. Suggest 2-4 short, actionable steps (one line each) to address it. Be specific and practical.
2. Suggest 2-4 tags/labels to categorize this item for Google Workspace (e.g. Gmail labels, Drive folders, or task labels). Use short, single-word or two-word tags like: Security, Identity, MFA, Backups, Compliance, Training, Access, Email, Payments, Incident-Response.

Checklist item: {title}
Context: {explanation or "General cyber hygiene."}
Existing steps: {steps_text or "None"}
{extra_context and f"Extra context: {extra_context}" or ""}

Return only a single JSON object with two keys: "suggestions" (array of step strings) and "tags" (array of tag strings). Example: {{"suggestions": ["Step one", "Step two"], "tags": ["Security", "MFA", "Identity"]}}. No other text."""

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        text = (resp.choices[0].message.content or "").strip()
        # Strip markdown code block if present
        if "```" in text:
            start = text.find("```")
            if text[start:start + 7] == "```json":
                start += 7
            else:
                start = text.find("\n", start) + 1 if text.find("\n", start) != -1 else start + 3
            end = text.find("```", start)
            if end != -1:
                text = text[start:end].strip()
        if "{" in text:
            text = text[text.index("{"):]
        try:
            data = json.loads(text)
            suggestions = data.get("suggestions") if isinstance(data.get("suggestions"), list) else []
            tags = data.get("tags") if isinstance(data.get("tags"), list) else []
            return {"suggestions": [str(s) for s in suggestions], "tags": [str(t) for t in tags]}
        except (json.JSONDecodeError, TypeError):
            pass
        return {"suggestions": [], "tags": []}
    except Exception as e:
        logger.exception("OpenAI AI suggestions failed: %s", e)
        return {"suggestions": [], "tags": []}
