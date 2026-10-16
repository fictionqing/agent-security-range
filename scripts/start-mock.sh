#!/usr/bin/env bash
# 无 GPU Mock 模式：后端 8801 + 前端 8800（开发热更新）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -x "$ROOT/.tools/node-v22.19.0-linux-x64/bin/node" ]]; then
  export PATH="$ROOT/.tools/node-v22.19.0-linux-x64/bin:$PATH"
fi

echo "[range] backend → 127.0.0.1:8801 (mock default_model_id)"
cd "$ROOT/backend"
./run.sh &
BACK_PID=$!

echo "[range] frontend → 0.0.0.0:8800"
cd "$ROOT/agent-security-range"
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
fi
npm run dev &
FRONT_PID=$!

trap 'kill $BACK_PID $FRONT_PID 2>/dev/null' EXIT INT TERM
wait
