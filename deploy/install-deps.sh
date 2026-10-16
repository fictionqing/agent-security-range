#!/usr/bin/env bash
# 无 GPU Mock：Python venv + 前端 build
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_DIR="${HOME}/.local/node-v22.19.0-linux-x64"
export PATH="${NODE_DIR}/bin:${PATH}"

if [[ ! -x "$NODE_DIR/bin/node" ]]; then
  echo "安装 Node 22 到 ${HOME}/.local ..."
  mkdir -p "${HOME}/.local"
  curl -fsSL "https://nodejs.org/dist/v22.19.0/node-v22.19.0-linux-x64.tar.xz" -o /tmp/node.tar.xz
  tar -xJf /tmp/node.tar.xz -C "${HOME}/.local"
  rm -f /tmp/node.tar.xz
fi

echo "后端依赖 ..."
cd "$ROOT/backend"
python3.11 -m venv .venv
./.venv/bin/pip install -U pip
./.venv/bin/pip install -r requirements.txt

echo "前端依赖与 build ..."
cd "$ROOT/agent-security-range"
[[ -f .env.local ]] || cp .env.example .env.local
npm install
npm run build

echo "完成。启动：sudo ./deploy/install-systemd.sh 或 ./scripts/start-mock-prod.sh"
