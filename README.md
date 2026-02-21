# StackTrail

Cyber checkup app for small businesses. Run a short assessment, get a Cyber Health Score, and turn findings into action items with AI suggestions and Trello cards.

## What it does

- **Organizations** – Add your business (name, domain, type, size) and run checkups per org.
- **Cyber Checkup** – Answer 12 questions; get a score (0–100), risk band, insurance readiness, and estimated breach impact.
- **Action items** – Expandable checklist with notes, AI-generated suggestions (OpenAI), and optional Trello integration to create cards in a “Suggestions” list.
- **Workflow** – One-click “Run workflow” creates Trello cards for all findings from the latest assessment.
- **Dark UI** – Friendly cyber theme across the app.

## Repo structure

```
stacktrail/
├── stacktrail_backend/   # Django API
└── stacktrail_frontend/   # React + Vite + TypeScript
```

## Backend (Django)

### Setup

```bash
cd stacktrail_backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=your-key
python manage.py migrate
python manage.py runserver
```

API runs at **http://127.0.0.1:8000/** by default. Optional: `python manage.py seed_demo` for demo data.

### Environment

| Variable        | Description                    |
|----------------|--------------------------------|
| `OPENAI_API_KEY` | OpenAI API key for AI suggestions |

## Frontend (React)

### Setup

```bash
cd stacktrail_frontend
npm install
npm run dev
```

App runs at **http://localhost:5173/** (or the port Vite shows). Set the API base URL in `src/api/client.ts` if your backend is not at `http://localhost:8000`.

## Quick start (both)

1. Backend: `cd stacktrail_backend && source venv/bin/activate && python manage.py runserver`
2. Frontend: `cd stacktrail_frontend && npm run dev`
3. Open the frontend URL, register or log in, add an organization, and run a Cyber Checkup.

## Trello (demo)

In an org’s detail page, expand **Trello (Suggestions)** and add your Trello API key, token, and the **Suggestions list ID** from your board. Cards created from the checklist or “Run workflow” will be added to that list.

## License

MIT (or your choice).
