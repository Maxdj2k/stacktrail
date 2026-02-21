#!/usr/bin/env bash
# StackTrail – run on a fresh Ubuntu 22.04 Droplet to install deps, backend, and frontend.
# Usage: clone repo to /opt/stacktrail (or set APP_DIR), create .env in stacktrail_backend, then:
#   sudo bash deploy/droplet-setup.sh
# After this, run certbot and enable nginx (see DEPLOYMENT.md).

set -e
APP_DIR="${APP_DIR:-/opt/stacktrail}"
cd "$APP_DIR"

echo "=== Installing system packages ==="
apt-get update
apt-get install -y nginx python3.11 python3.11-venv python3-pip nodejs npm certbot python3-certbot-nginx

echo "=== Backend (Django) ==="
cd "$APP_DIR/stacktrail_backend"
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
if [ -f .env ]; then
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput 2>/dev/null || true
fi
deactivate

echo "=== Frontend (React) ==="
cd "$APP_DIR/stacktrail_frontend"
npm ci
npm run build

echo "=== Gunicorn systemd service ==="
cat > /tmp/stacktrail-gunicorn.service << EOF
[Unit]
Description=StackTrail Gunicorn
After=network.target

[Service]
User=root
WorkingDirectory=$APP_DIR/stacktrail_backend
ExecStart=$APP_DIR/stacktrail_backend/venv/bin/gunicorn guardrail.wsgi:application --bind 127.0.0.1:8000 --workers 2
Restart=always
Environment=PATH=$APP_DIR/stacktrail_backend/venv/bin

[Install]
WantedBy=multi-user.target
EOF
mv /tmp/stacktrail-gunicorn.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable stacktrail-gunicorn
systemctl restart stacktrail-gunicorn

echo "=== Nginx (HTTP first; Certbot will add HTTPS) ==="
cp "$APP_DIR/deploy/nginx.stacktrail-http-only.conf" /etc/nginx/sites-available/stacktrail
ln -sf /etc/nginx/sites-available/stacktrail /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Done ==="
echo "1. Ensure stacktrail_backend/.env exists (DJANGO_SECRET_KEY, ALLOWED_HOSTS, OPENAI_API_KEY, etc.)."
echo "2. Run: sudo certbot --nginx -d stacktrail.org -d www.stacktrail.org"
echo "3. Gunicorn: systemctl status stacktrail-gunicorn"
