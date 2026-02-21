"""Create cards/tickets in Trello, Jira, and Google Workspace (Tasks)."""
import requests


def create_trello_card(api_key: str, token: str, list_id: str, name: str, desc: str, member_id: str = None) -> dict:
    url = "https://api.trello.com/1/cards"
    params = {"key": api_key, "token": token}
    data = {"idList": list_id, "name": name, "desc": desc}
    if member_id:
        data["idMembers"] = member_id
    r = requests.post(url, params=params, json=data, timeout=10)
    r.raise_for_status()
    return r.json()


def create_jira_issue(domain: str, email: str, api_token: str, project_key: str, summary: str, description: str, assignee_id: str = None) -> dict:
    url = f"https://{domain.rstrip('/')}/rest/api/3/issue"
    auth = (email, api_token)
    payload = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}],
            },
            "issuetype": {"name": "Task"},
        }
    }
    if assignee_id:
        payload["fields"]["assignee"] = {"accountId": assignee_id}
    r = requests.post(url, json=payload, auth=auth, headers={"Accept": "application/json", "Content-Type": "application/json"}, timeout=10)
    r.raise_for_status()
    return r.json()


def create_google_task(access_token: str, task_list_id: str, title: str, notes: str) -> dict:
    """Create a task in Google Tasks. Use OAuth2 access_token."""
    url = f"https://tasks.googleapis.com/tasks/v1/lists/{task_list_id}/tasks"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    body = {"title": title, "notes": notes}
    r = requests.post(url, json=body, headers=headers, timeout=10)
    r.raise_for_status()
    return r.json()
