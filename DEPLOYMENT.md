# Deploying StackTrail to stacktrail.org

You can deploy with **Nginx on one server** (recommended) or with a **split** setup (e.g. Vercel + Render).

---

## Deploy the entire app with DigitalOcean

You can run the full app (frontend + backend) on DigitalOcean in two ways:

| Option | What you get |
|--------|----------------|
| **Droplet (Nginx)** | One Ubuntu server. Nginx serves the app and proxies `/api` to Django. You SSH in, clone the repo, run a setup script (or follow manual steps). |
| **App Platform** | Two managed components (backend Web Service + frontend Static Site). No SSH; you set source directories and env vars in the DO dashboard. |

---

### Option A: One Droplet (Nginx) – entire app on one server

1. **Create a Droplet** in the DigitalOcean control panel: **Ubuntu 22.04**, size at least Basic 1 GB. Add your SSH key. Note the Droplet’s IP.

2. **Point your domain** at that IP: at your registrar, add an **A** record for **stacktrail.org** (and **www.stacktrail.org** if you want) to the Droplet IP.

3. **Clone the repo on the Droplet** (or push your code to GitHub and clone from there):
   ```bash
   sudo mkdir -p /opt/stacktrail
   sudo chown "$USER" /opt/stacktrail
   git clone https://github.com/YOUR_USERNAME/stacktrail.git /opt/stacktrail
   cd /opt/stacktrail
   ```

4. **Create the backend `.env`** so the app can run:
   ```bash
   cp /opt/stacktrail/stacktrail_backend/.env.example /opt/stacktrail/stacktrail_backend/.env
   nano /opt/stacktrail/stacktrail_backend/.env
   ```
   Set at least: `DJANGO_SECRET_KEY` (long random string), `DJANGO_DEBUG=0`, `ALLOWED_HOSTS=stacktrail.org,www.stacktrail.org,127.0.0.1`, `CORS_ALLOWED_ORIGINS=https://stacktrail.org,https://www.stacktrail.org`, `OPENAI_API_KEY=your-key`.

5. **Run the setup script** (installs Nginx, Python, Node, backend, frontend, Gunicorn systemd, Nginx config):
   ```bash
   cd /opt/stacktrail
   sudo bash deploy/droplet-setup.sh
   ```

6. **Enable HTTPS:**
   ```bash
   sudo certbot --nginx -d stacktrail.org -d www.stacktrail.org
   ```

7. Open **https://stacktrail.org** – you should see the app; **https://stacktrail.org/api/** should return the API.

If you prefer to do it step by step without the script, follow **[Nginx (one server)](#nginx-one-server)** below (same result).

---

### Option B: App Platform – two components (no Nginx, no SSH)

App Platform does not see the app at repo root. You add **two components** and set **Source Directory** for each.

1. **Create an App** from your GitHub repo. When it says “No components detected”, click **Edit** or **Add Component**.

2. **Backend component**
   - Type: **Web Service**.
   - **Source Directory:** `stacktrail_backend`.
   - **Build Command:** `pip install -r requirements.txt`.
   - **Run Command:** `gunicorn guardrail.wsgi:application --bind 0.0.0.0:$PORT`.
   - **Environment variables** (add in the dashboard):
     - `DJANGO_SECRET_KEY` (generate a long random string)
     - `DJANGO_DEBUG` = `0`
     - `ALLOWED_HOSTS` = `your-app.ondigitalocean.app` (use the URL DO gives this service; add a custom domain later if you want)
     - `CORS_ALLOWED_ORIGINS` = `https://your-frontend.ondigitalocean.app` (replace with your frontend URL once it exists)
     - `OPENAI_API_KEY` = your OpenAI key
   - Deploy and note the backend URL (e.g. `https://stacktrail-api-xxxxx.ondigitalocean.app`).

3. **Frontend component**
   - Type: **Static Site** (or Web Service if you prefer).
   - **Source Directory:** `stacktrail_frontend`.
   - **Build Command:** `npm ci && npm run build`.
   - **Output Directory:** `dist`.
   - **Environment variable:** `VITE_API_BASE` = your backend URL from step 2 (e.g. `https://stacktrail-api-xxxxx.ondigitalocean.app`).
   - Deploy. Add a custom domain (e.g. stacktrail.org) in the DO app settings if you want.

4. **CORS:** In the backend component, set `CORS_ALLOWED_ORIGINS` to your frontend URL (the DO static site URL or `https://stacktrail.org` if you attached the domain).

Result: frontend and backend both on DigitalOcean; frontend calls backend via `VITE_API_BASE`.

---

## Nginx (one server)

Run frontend and backend on a single VPS. Nginx serves the React app and proxies `/api` to Django. Result: **https://stacktrail.org** and **https://stacktrail.org/api**.

### 1. Server setup

- Create a VPS (Ubuntu 22.04). Point **stacktrail.org** (and **www.stacktrail.org** if you want) to the server’s IP via an **A** record at your domain registrar.
- SSH in and install Nginx, Python 3.11+, Node 18+ (for building the frontend), and optionally PostgreSQL:

```bash
sudo apt update
sudo apt install -y nginx python3.11 python3.11-venv python3-pip nodejs npm
# Optional: sudo apt install -y postgresql postgresql-contrib
```

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

Use a process manager (e.g. systemd) so Gunicorn restarts on reboot.

### 3. Frontend (React)

```bash
cd /opt/stacktrail/stacktrail_frontend
npm ci
npm run build
```

Do **not** set `VITE_API_BASE` so the app uses `/api` (same origin). Nginx will serve the built files and proxy `/api` to Django.

### 4. Nginx

Use the included config and enable SSL with Certbot:

```bash
# Copy the repo’s Nginx config (or create from the example below)
sudo cp /opt/stacktrail/deploy/nginx.stacktrail.conf /etc/nginx/sites-available/stacktrail
sudo ln -sf /etc/nginx/sites-available/stacktrail /etc/nginx/sites-enabled/
# Remove default site if it conflicts
sudo rm -f /etc/nginx/sites-enabled/default

# Get SSL cert (Nginx will be updated automatically)
sudo certbot --nginx -d stacktrail.org -d www.stacktrail.org

sudo nginx -t && sudo systemctl reload nginx
```

Config file: **[deploy/nginx.stacktrail.conf](deploy/nginx.stacktrail.conf)**. If your app path is not `/opt/stacktrail`, edit the `root` line and the comments accordingly.

Result: **https://stacktrail.org** serves the app; **https://stacktrail.org/api** hits the Django API.

### Nginx deployment checklist

- [ ] VPS created; **stacktrail.org** (and www) A record points to server IP.
- [ ] Nginx, Python 3.11+, Node 18+ installed; app at `/opt/stacktrail` (or your path).
- [ ] Backend: `.env` with `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `OPENAI_API_KEY`; migrations run; Gunicorn running (e.g. systemd) on `127.0.0.1:8000`.
- [ ] Frontend: `npm run build` in `stacktrail_frontend`; no `VITE_API_BASE` set.
- [ ] Nginx: [deploy/nginx.stacktrail.conf](deploy/nginx.stacktrail.conf) in `sites-enabled`; Certbot run for SSL; `nginx -t` and `reload`.

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

## General checklist

- [ ] Domain **stacktrail.org** points to your frontend (A record for Nginx; A/CNAME for split).
- [ ] If split: **api.stacktrail.org** points to your backend.
- [ ] Backend: `DJANGO_SECRET_KEY` set, `DJANGO_DEBUG=0`, `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` set.
- [ ] Frontend: for Nginx leave `VITE_API_BASE` unset; for split set `VITE_API_BASE` to your API URL.
- [ ] HTTPS enabled (Certbot for Nginx; automatic on Vercel/Render).
- [ ] **Revoke and create a new OpenAI API key** if the old one was ever committed or shared.
