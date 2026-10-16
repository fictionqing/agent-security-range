#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PYTHONPATH="$ROOT"

# Mock / 无 GPU：不绑定 CUDA；有 GPU 时可 export CUDA_VISIBLE_DEVICES=0
unset CUDA_VISIBLE_DEVICES

if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PYTHON="${PYTHON:-$ROOT/.venv/bin/python}"
else
  PYTHON="${PYTHON:-python3}"
fi

HOST="${RANGE_API_HOST:-127.0.0.1}"
PORT="${RANGE_API_PORT:-8801}"
RELOAD="${RANGE_API_RELOAD:-1}"

ARGS=(--host "$HOST" --port "$PORT")
if [[ "$RELOAD" == "1" ]]; then
  ARGS+=(--reload)
fi

exec "$PYTHON" -m uvicorn api.main:app "${ARGS[@]}"
