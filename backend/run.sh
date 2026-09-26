#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PYTHONPATH="$ROOT"
export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}"
PYTHON="${PYTHON:-/root/anaconda3/bin/python}"
exec "$PYTHON" -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
