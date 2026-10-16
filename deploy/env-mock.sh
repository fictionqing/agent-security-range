# 无 GPU Mock 部署环境变量（可被 systemd / 手工 source）
export RANGE_PROJECT_ROOT="${RANGE_PROJECT_ROOT:-/home/ubuntu/range}"
export PATH="${RANGE_PROJECT_ROOT}/.local-node/bin:${HOME}/.local/node-v22.19.0-linux-x64/bin:${PATH}"
export PYTHONPATH="${RANGE_PROJECT_ROOT}/backend"
export RANGE_API_HOST=0.0.0.0
export RANGE_API_PORT=8801
export RANGE_API_RELOAD=0
