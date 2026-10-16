#!/usr/bin/env bash
# Serve local Qwen3-8B via vLLM OpenAI-compatible API (port 8001)
set -euo pipefail
MODEL_PATH="${MODEL_PATH:-/root/models/Qwen3-8B}"
PORT="${PORT:-8001}"
HOST="${HOST:-0.0.0.0}"
export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}"

PYTHON="${PYTHON:-/root/anaconda3/bin/python}"

echo "[vllm] serving $MODEL_PATH on ${HOST}:${PORT}"
exec "$PYTHON" -m vllm.entrypoints.openai.api_server \
  --model "$MODEL_PATH" \
  --served-model-name Qwen3-8B \
  --host "$HOST" \
  --port "$PORT" \
  --dtype auto \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.85 \
  --trust-remote-code
