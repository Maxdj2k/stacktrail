# Deploy StackTrail: Frontend on Vercel, Backend on Render

Step-by-step instructions to run the React frontend on Vercel and the Django backend on Render. Deploy the **backend first** so you have an API URL for the frontend.

---

## Part 1: Backend on Render

### 1.1 Create a Render account and connect GitHub

1. Go to [render.com](https://render.com) and sign up (or log in).
2. Connect your GitHub account: **Account Settings** → **Integrations** → connect the repo that contains StackTrail.

### 1.2 Create the backend from the Blueprint

1. In the Render dashboard, click **New** → **Blueprint**.
2. Connect the **same GitHub repo** that has your StackTrail code (repo root).
3. When asked for the Blueprint file path, set it to:
   ```text
   render.yaml
   ```
   (The repo has a `render.yaml` at the root that defines the backend service and database.)
4. Render will detect:
   - A **PostgreSQL** database (`stacktrail-db`)
   - A **Web Service** (`stacktrail-api`) with root directory `stacktrail_backend`

### 1.3 Set required environment variables

In the **stacktrail-api** service → **Environment** tab, set these (Render may prefill some from the Blueprint):

| Key | Value |
|-----|--------|
| `OPENAI_API_KEY` | Your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys) |
| `ALLOWED_HOSTS` | `stacktrail-api.onrender.com` (replace with your actual Render service hostname; you’ll see it after first deploy, e.g. `stacktrail-api-xxxx.onrender.com`) |

Optional for custom domain later:

- `ALLOWED_HOSTS`: add `api.stacktrail.org` when you point a domain at the service.
- `CORS_ALLOWED_ORIGINS`: Blueprint sets `https://stacktrail.org,https://www.stacktrail.org`. Add your Vercel URL for testing, e.g. `https://your-app.vercel.app`.

### 1.4 Deploy the backend

1. Click **Apply** or **Create resources**.
2. Render will create the database and the web service, run `pip install -r requirements.txt`, run `python manage.py migrate --noinput`, then start Gunicorn.
3. Wait for the deploy to finish. Open the service URL (e.g. `https://stacktrail-api-xxxx.onrender.com`).
4. Check the API: visit `https://<your-service>.onrender.com/api/` — you should get a response (e.g. 401 or a JSON response), not a 404.
5. **Copy the backend URL** (e.g. `https://stacktrail-api-xxxx.onrender.com`) — you need it for the frontend. Do **not** add `/api` at the end; the frontend adds that when calling the API.

### 1.5 (Optional) Custom domain for the API

- In the **stacktrail-api** service → **Settings** → **Custom Domain**, add `api.stacktrail.org`.
- At your domain registrar, add a **CNAME** record: `api` → `<your-service>.onrender.com` (Render shows the exact target).
- In **Environment**, set `ALLOWED_HOSTS` to include `api.stacktrail.org` (comma-separated with the Render hostname).
- Update `CORS_ALLOWED_ORIGINS` if needed.

---

## Part 2: Frontend on Vercel

### 2.1 Create a Vercel account and connect GitHub

1. Go to [vercel.com](https://vercel.com) and sign up (or log in).
2. **Add New** → **Project** and import your **GitHub repo** (the same StackTrail repo).

### 2.2 Configure the project

1. **Root Directory:** Click **Edit** and set to:
   ```text
   stacktrail_frontend
   ```
   (Do not use the repo root.)

2. **Framework Preset:** Vite (or leave as auto-detected).

3. **Build & Output:** The repo’s `vercel.json` already sets:
   - Build command: `npm run build`
   - Output directory: `dist`
   - SPA rewrites for client-side routing  
   You can leave these as-is. If Vercel doesn’t pick them up, set:
   - **Build Command:** `npm ci && npm run build`
   - **Output Directory:** `dist`

### 2.3 Set environment variable

1. In the project, go to **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_BASE`
   - **Value:** Your Render backend URL from Part 1 (e.g. `https://stacktrail-api-xxxx.onrender.com`). No trailing slash, no `/api`.
3. Apply to **Production** (and **Preview** if you want preview deployments to use the same API).

### 2.4 Deploy

1. Click **Deploy** (or push to the branch connected to the project).
2. Wait for the build to finish. Vercel will give you a URL like `https://stacktrail-xxxx.vercel.app`.
3. Open that URL and test login / API calls. If you see CORS or network errors, add the Vercel URL to the backend’s `CORS_ALLOWED_ORIGINS` on Render.

### 2.5 (Optional) Custom domain for the frontend

1. In the Vercel project → **Settings** → **Domains**, add `stacktrail.org` (and `www.stacktrail.org` if you want).
2. Vercel will show the DNS records to add at your registrar (usually **A** or **CNAME** for `@` and **CNAME** for `www`).
3. After DNS propagates, the app will be available at your domain.

---

## Part 3: CORS and DNS checklist

### Backend (Render)

- [ ] `ALLOWED_HOSTS` includes your Render hostname (and `api.stacktrail.org` if you use it).
- [ ] `CORS_ALLOWED_ORIGINS` includes every origin the browser will use:
  - Your Vercel URL (e.g. `https://stacktrail-xxxx.vercel.app`).
  - If you added a custom domain: `https://stacktrail.org`, `https://www.stacktrail.org`.

### Frontend (Vercel)

- [ ] **Root Directory** is `stacktrail_frontend`.
- [ ] **Environment variable** `VITE_API_BASE` is set to the Render backend URL (no trailing slash).

### DNS (if using custom domains)

- [ ] **stacktrail.org** and **www** point to Vercel (records shown in Vercel Domains).
- [ ] **api.stacktrail.org** CNAME points to your Render web service hostname.

---

## Quick reference

| What | Where |
|------|--------|
| Backend repo path | `stacktrail_backend` (Blueprint: `render.yaml` at repo root) |
| Backend build | `pip install -r requirements.txt` |
| Backend start | `gunicorn guardrail.wsgi:application --bind 0.0.0.0:$PORT` |
| Backend migrations | Run automatically via `preDeployCommand` in Blueprint |
| Frontend repo path | `stacktrail_frontend` |
| Frontend build | `npm ci && npm run build` (or `npm run build`) |
| Frontend output | `dist` |
| Frontend env | `VITE_API_BASE` = backend URL |

After both are deployed, open your Vercel URL (or custom domain), sign in or register, and confirm the app talks to the Render API.
