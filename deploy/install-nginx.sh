#!/usr/bin/env bash
# 将 Nginx 反代到 Next 8800（80/443）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONF_SRC="$ROOT/deploy/nginx/agent-security-range.conf"
CONF_DST="/etc/nginx/sites-available/agent-security-range.conf"

if [[ ! -f "$CONF_SRC" ]]; then
  echo "missing $CONF_SRC"
  exit 1
fi

sudo apt-get install -y nginx ssl-cert
sudo cp "$CONF_SRC" "$CONF_DST"
sudo ln -sf "$CONF_DST" /etc/nginx/sites-enabled/agent-security-range.conf
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
echo "Nginx: http://<host>/ → 127.0.0.1:8800"
