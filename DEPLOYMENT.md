# Deploying StackTrail to stacktrail.org

You have two main options: **one server** (VPS) or **split** (frontend + backend on different hosts). Both work with your domain **stacktrail.org**.

---

## Option 1: One server (VPS: DigitalOcean, Linode, etc.)

Run frontend and backend on a single machine. The site is **https://stacktrail.org** and the API is **https://stacktrail.org/api**.

### 1. Server setup

- Create a VPS (Ubuntu 22.04). Point **stacktrail.org** (and **www.stacktrail.org** if you want) to the server’s IP via an **A** record at your domain registrar.
- SSH in and install: Nginx, Python 3.11+, Node 18+ (for building the frontend), and optionally PostgreSQL.

### 2. Backend (Django)

```bash
cd /opt/stacktrail/stacktrail_backend  # or your path
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

Create `.env`:

```env
DJANGO_SECRET_KEY=your-long-random-secret
DJANGO_DEBUG=0
ALLOWED_HOSTS=stacktrail.org,www.stacktrail.org,127.0.0.1
CORS_ALLOWED_ORIGINS=https://stacktrail.org,https://www.stacktrail.org
OPENAI_API_KEY=your-openai-key
```

If using PostgreSQL, set `USE_POSTGRES=1` and set `NAME`, `USER`, `PASSWORD`, `HOST`, `PORT` (e.g. via env or in `settings.py`). Then:

```bash
python manage.py migrate
python manage.py collectstatic --noinput  # if you add static files later
```

Run with Gunicorn (Nginx will proxy to this):

```bash
gunicorn guardrail.wsgi:application --bind 127.0.0.1:8000 --workers 2
```

Use a process manager (systemd, or Supervisor) so it restarts on reboot.

### 3. Frontend (React)

```bash
cd /opt/stacktrail/stacktrail_frontend
npm ci
npm run build
```

Don’t set `VITE_API_BASE` so the app uses `/api` (same origin). Nginx will serve the built files and proxy `/api` to Django.

### 4. Nginx

Example config for **stacktrail.org** (and www) with SSL via Certbot:

```nginx
server {
    listen 80;
    server_name stacktrail.org www.stacktrail.org;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name stacktrail.org www.stacktrail.org;
    ssl_certificate /etc/letsencrypt/live/stacktrail.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stacktrail.org/privkey.pem;

    root /opt/stacktrail/stacktrail_frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then:

```bash
sudo certbot --nginx -d stacktrail.org -d www.stacktrail.org
sudo systemctl reload nginx
```

Result: **https://stacktrail.org** serves the app; **https://stacktrail.org/api** hits the Django API.

---

## Option 2: Split (e.g. Vercel + Render)

- **Frontend** at **https://stacktrail.org** (Vercel, Netlify, etc.)
- **Backend** at **https://api.stacktrail.org** (Render, Railway, Fly.io, etc.)

The repo includes config to make this flow one-click where possible:

- **Backend**: `stacktrail_backend/render.yaml` – Blueprint for a Render Web Service + PostgreSQL, with `DATABASE_URL`, migrations (preDeployCommand), and env var placeholders. Set Blueprint path to `stacktrail_backend/render.yaml` and provide `OPENAI_API_KEY` and `ALLOWED_HOSTS` (e.g. `api.stacktrail.org,<your-service>.onrender.com`) in the dashboard.
- **Frontend**: `stacktrail_frontend/vercel.json` – Build output `dist` and SPA rewrites for client-side routing.

### Split deployment checklist (order of operations)

1. **Render (backend)**  
   Create a Blueprint from the repo, path `stacktrail_backend/render.yaml`. Create/link the PostgreSQL DB, set `ALLOWED_HOSTS` and `OPENAI_API_KEY` in the dashboard. Deploy; note the service URL (e.g. `https://stacktrail-xxx.onrender.com`).

2. **Vercel (frontend)**  
   New project from GitHub, root `stacktrail_frontend`. Build: `npm ci && npm run build`, output `dist`. Set env `VITE_API_BASE=https://api.stacktrail.org` for production. Add domain `stacktrail.org` (and `www` if desired).

3. **DNS**  
   Point **stacktrail.org** and **www** to Vercel; point **api.stacktrail.org** (CNAME) to the Render web service host. Wait for propagation.

4. **Verify**  
   Open `https://stacktrail.org` and `https://api.stacktrail.org/api/`; confirm login and API calls work.

### 1. DNS (at your domain registrar)

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | (Vercel’s IP or use CNAME) |
| CNAME | www  | cname.vercel-dns.com (if using Vercel) |
| CNAME | api  | (your backend host, e.g. `stacktrail-api.onrender.com`) |

Vercel and Netlify will give you exact records when you add the domain.

### 2. Backend (e.g. Render)

- New **Web Service**. Connect your GitHub repo, root: `stacktrail_backend`.
- Build: `pip install -r requirements.txt`
- Start: `gunicorn guardrail.wsgi:application --bind 0.0.0.0:$PORT`
- Add **PostgreSQL** (from Render dashboard) and set `USE_POSTGRES=1` and the DB env vars (Render gives `DATABASE_URL`; you can use `dj-database-url` in Django to parse it, or set `HOST`, `NAME`, `USER`, `PASSWORD` manually).
- Environment variables:
  - `DJANGO_SECRET_KEY` (random string)
  - `DJANGO_DEBUG=0`
  - `ALLOWED_HOSTS=api.stacktrail.org,your-app.onrender.com`
  - `CORS_ALLOWED_ORIGINS=https://stacktrail.org,https://www.stacktrail.org`
  - `OPENAI_API_KEY=...`
- Run migrations in the shell or via a release command.

Point **api.stacktrail.org** (CNAME) to the Render URL they give you.

### 3. Frontend (e.g. Vercel)

- New project from GitHub, root: `stacktrail_frontend`.
- Build: `npm ci && npm run build`
- Output: `dist`
- **Environment variable** for production:
  - `VITE_API_BASE=https://api.stacktrail.org`
- Add domain **stacktrail.org** (and www) in Vercel; it will show the DNS records to add.

After DNS propagates, **https://stacktrail.org** uses the API at **https://api.stacktrail.org**.

---

## Checklist

- [ ] Domain **stacktrail.org** points to your frontend (A/CNAME).
- [ ] If split: **api.stacktrail.org** points to your backend.
- [ ] Backend: `DJANGO_SECRET_KEY` set, `DJANGO_DEBUG=0`, `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` set.
- [ ] Frontend (split only): `VITE_API_BASE` set to your API URL.
- [ ] HTTPS enabled (Certbot on VPS; automatic on Vercel/Render).
- [ ] **Revoke and create a new OpenAI API key** if the old one was ever committed or shared.
