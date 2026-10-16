#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

"$ROOT/deploy/install-deps.sh"

sudo cp "$ROOT/deploy/systemd/range-backend.service" /etc/systemd/system/
sudo cp "$ROOT/deploy/systemd/range-frontend.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now range-backend.service range-frontend.service
sudo systemctl status range-backend.service range-frontend.service --no-pager
