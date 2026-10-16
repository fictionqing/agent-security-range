#!/usr/bin/env bash
# 无 GPU 生产式 Mock：后端 127.0.0.1:8801 + 前端 0.0.0.0:8800（next start）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${HOME}/.local/node-v22.19.0-linux-x64/bin"
export PATH="$NODE_BIN:${PATH:-/usr/bin:/bin}"

if [[ ! -x "$NODE_BIN/node" ]]; then
  echo "缺少 Node 22：$NODE_BIN/node（见 MIGRATION.md / deploy/install-deps.sh）"
  exit 1
fi

if [[ ! -x "$ROOT/backend/.venv/bin/python" ]]; then
  echo "请先: cd $ROOT/backend && python3.11 -m venv .venv && pip install -r requirements.txt"
  exit 1
fi

cd "$ROOT/agent-security-range"
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
fi
if [[ ! -d .next ]]; then
  npm ci 2>/dev/null || npm install
  npm run build
fi

echo "[range] backend → 127.0.0.1:8801 (mock default_model_id)"
cd "$ROOT/backend"
export PYTHONPATH="$ROOT/backend"
export RANGE_API_RELOAD=0
"$ROOT/backend/.venv/bin/python" -m uvicorn api.main:app --host 0.0.0.0 --port 8801 &
BACK_PID=$!

echo "[range] frontend → 0.0.0.0:8800"
cd "$ROOT/agent-security-range"
npm run start &
FRONT_PID=$!

trap 'kill $BACK_PID $FRONT_PID 2>/dev/null' EXIT INT TERM
wait
