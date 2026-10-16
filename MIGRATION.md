# 迁移到新云主机：环境依赖清单

按当前开发机与仓库实际配置整理，方便在另一台主机上重新搭建 **Agent Security Range**（`range`）。

仓库里**没有**模型权重、没有 `node_modules`、没有 `.env.local`、没有 Anaconda，因此新主机不能只 `git clone` 就完事。

## 阅读前注意

1. **Git 远程 `main` 可能还没有**「前端 8800 反代后端 8801」这批本地改动（`backend/run.sh`、`agent-security-range/next.config.mjs`、`package.json`、`src/lib/api.ts`、`.env.example` 等）。迁过去时请把这些文件一起拷贝，或先提交再拉取，否则新机仍是旧端口。
2. 项目**设计目标**是 RTX 4090 48GB 跑 Qwen3-8B。整理清单时的那台云主机可能**没有可用 GPU**（`nvidia-smi` 失败）。新机器若要跑真实模型，请按下面「GPU 档」选配置，不要按 2GB 无卡机来。

---

## 0. 建议新机器规格

| 用途 | CPU | 内存 | 磁盘 | GPU |
|---|---|---|---|---|
| 只跑 Mock UI + API | 2 核即可 | ≥ 4 GB | ≥ 20 GB | 不需要 |
| 跑 Qwen3-8B（Transformers+CUDA） | ≥ 8 核更稳 | ≥ 32 GB 更稳 | ≥ 80 GB | **24GB 显存即可**（实测 8B bf16 峰值约 15GB）；48GB 更宽裕 |
| 以后 32B / 多并发 | 更高 | 更高 | 更高 | A100 80GB / H100 |

**操作系统：** Ubuntu 22.04 x86_64（当前机：`Ubuntu 22.04.4 LTS`，内核 `6.5.0-28-generic`）。

**磁盘粗算：** 代码 ~1GB + Anaconda ~16GB（可不装，用 venv）+ Qwen3-8B **16GB** + Qwen3-0.6B **1.5GB** + `node_modules` ~0.5GB。有 GPU 权重时建议磁盘 **≥ 80GB**。

---

## 1. 系统级软件

```bash
sudo apt-get update
sudo apt-get install -y git curl build-essential ca-certificates \
  python3 python3-venv python3-pip libssl-dev
```

| 软件 | 当前版本 | 用途 |
|---|---|---|
| Git | 2.34.1 | 拉代码 |
| curl | 7.81.0 | 下载 / 健康检查 |
| build-essential | Ubuntu 22.04 默认 | 编译原生扩展 |
| OpenSSH | 系统自带 | 登录 |
| GitHub CLI `gh` | 可选；当前 2.67.0 | 推 PR，不是运行时必须 |

系统自带 `python3` 在 Ubuntu 22.04 上通常是 **3.10**，不要直接用来跑后端。项目实际用的是 **Python 3.11.7**。

有 GPU 时还要：

- NVIDIA 驱动（能跑 `nvidia-smi`）
- CUDA 与 PyTorch 对齐：当前安装的是 **torch 2.5.1+cu124**（CUDA **12.4** 的 pip 包，自带 `nvidia-*-cu12`，一般**不必**再装完整 CUDA Toolkit）
- 当前机有 `nvidia-container-toolkit 1.13.5`（只有用 Docker GPU 时才需要）

---

## 2. Python 运行时（后端必须）

### 2.1 解释器

| 项 | 当前值 |
|---|---|
| 实际在用的解释器 | `/root/anaconda3/bin/python`（Anaconda，conda 24.5.0） |
| 版本 | **Python 3.11.7** |
| `backend/.venv` | 有目录，但几乎是空的（只有 pip/setuptools），**没有在用** |
| `run.sh` 默认 | `PYTHON=/root/anaconda3/bin/python` |

新机两种做法都可以：

- 装 Miniconda/Anaconda，Python 3.11
- 或 `python3.11 -m venv backend/.venv`，并把 `run.sh` 里的 `PYTHON` 改成 venv 的 python

启动时必须能 import 后端包：`run.sh` 已设置 `PYTHONPATH` 为 `backend/` 根目录。

### 2.2 仓库声明的后端依赖（Mock 就能跑 API）

文件：`backend/requirements.txt`

```text
fastapi>=0.115.0          # 当前机 0.141.1
uvicorn[standard]>=0.32.0 # 当前机 0.53.0
pydantic>=2.9.0           # 当前机 2.13.5
pydantic-settings>=2.6.0  # 当前机 2.15.0
httpx>=0.27.0             # 当前机 0.28.1
pyyaml>=6.0.2             # 当前机 6.0.3
python-multipart>=0.0.12  # 当前机 0.0.32
```

GitHub Actions CI（`backend-tests`）也只安装这些，Python 版本为 **3.11**。

### 2.3 真实模型额外依赖（不在 requirements.txt 里）

跑 Qwen / Transformers 路径时，当前 Anaconda 环境已装：

| 包 | 当前版本 | 说明 |
|---|---|---|
| torch | **2.5.1+cu124** | GPU 必装 CUDA 版；CPU-only 只能极慢试 0.6B |
| transformers | **5.17.0** | 本地推理 |
| accelerate | 1.15.0 | `device_map` |
| safetensors | 0.8.0 | 权重格式 |
| tokenizers | 0.23.2 | |
| huggingface_hub | 1.32.0 | 从 Hugging Face 下模型 |
| numpy | 1.26.4 | |
| openai | 3.15.0 | 仅当模型 `backend` 改为 vLLM OpenAI API 时用 |
| modelscope | 1.40.1 | 国内下模型（脚本 `backend/scripts/download_model_ms.py`） |

当前 torch 带着的 NVIDIA pip 包（cu12）包括：`nvidia-cublas-cu12==12.4.5.8`、`nvidia-cuda-runtime-cu12==12.4.127`、`nvidia-cudnn-cu12==9.1.0.70`、`nvidia-nccl-cu12==2.21.5`、`triton==3.1.0` 等。

**推荐新机安装命令（有 GPU）：**

```bash
pip install -r backend/requirements.txt
pip install torch==2.5.1 --index-url https://download.pytorch.org/whl/cu124
pip install transformers==5.17.0 accelerate safetensors
# 国内下模型再加：
pip install modelscope huggingface_hub
```

**vLLM：当前未安装**（`import vllm` 失败）。`backend/scripts/serve_qwen3_8b.sh` 是可选加速路径，新机可以先不装。装好后把 `backend/configs/models.yaml` 里 `qwen3-8b.backend` 改为 `vllm` 即可切换。

---

## 3. Node.js 运行时（前端必须）

系统 apt **没有**全局 `node`。当前开发机用的是便携包：

| 项 | 当前值 |
|---|---|
| 路径 | `/root/range/.tools/node-v22.19.0-linux-x64/`（被 `.gitignore`，**不会进 Git**） |
| Node | **v22.19.0** |
| npm | **10.9.3** |
| 已装的 `node_modules` | `agent-security-range/node_modules`，约 493MB，也不进 Git |
| lockfile | **没有** `package-lock.json` |
| CI 用的 Node | **20**（typecheck 即可；本地 22 也能跑） |

新机建议：

```bash
# 任选：nvm / 官方 Node 22 / 或把 .tools/node-v22.19.0-linux-x64 拷过去
node -v   # 建议 20 或 22
cd agent-security-range
cp .env.example .env.local
npm install
```

### 3.1 npm 依赖（`agent-security-range/package.json`）

运行时：

- `next@15.5.3`（当前 `node_modules` 即为 15.5.3）
- `react` / `react-dom` `^19.0.0`
- `recharts@^2.15.0`
- `lucide-react@^0.475.0`
- `class-variance-authority@^0.7.1`
- `clsx@^2.1.1`
- `tailwind-merge@^3.0.1`

开发：

- `typescript@^5`
- `tailwindcss@^3.4.17`
- `postcss@^8`
- `autoprefixer@^10.4.20`
- `@types/node@^22`、`@types/react@^19`、`@types/react-dom@^19`

本地未提交改动下，启动脚本为：

```text
next dev --turbopack --hostname 0.0.0.0 --port 8800
next start --hostname 0.0.0.0 --port 8800
```

GitHub 上旧版可能仍是 `3000` / `8801`，以迁过去的 `package.json` 为准。

---

## 4. 模型权重（不在 Git 里）

配置文件：`backend/configs/models.yaml`  
默认根目录：**`/root/models`**

| 目录 | 大小 | 状态 | 用途 |
|---|---|---|---|
| `/root/models/Qwen3-8B/` | **~16GB** | 已齐（5 个 `model-0000x-of-00005.safetensors` + tokenizer + config） | 主模型 |
| `/root/models/Qwen3-0.6B/` | **~1.5GB** | 已齐（单文件 `model.safetensors`） | 小模型对照 |
| `/root/models/Llama-3.1-8B-Instruct/` | 空壳 | YAML `offline` | 未用 |
| `/root/models/DeepSeek-R1-Distill-Qwen-7B/` | 空壳 | YAML `offline` | 未用 |

Qwen3-8B 至少要有：`config.json`、`tokenizer.json`、`model.safetensors.index.json`、五个 shard。

Shard 体积（当前机实测合计约 16.4GB）：

```text
model-00001-of-00005.safetensors  ~3.7 GB
model-00002-of-00005.safetensors  ~3.7 GB
model-00003-of-00005.safetensors  ~3.7 GB
model-00004-of-00005.safetensors  ~3.0 GB
model-00005-of-00005.safetensors  ~1.2 GB
```

迁移办法：

- **rsync/scp 拷贝** `/root/models/Qwen3-8B` 和 `Qwen3-0.6B`（最快）
- 或在新机重新下载（国内推荐 ModelScope）：

```bash
cd backend
PYTHONPATH=. python scripts/download_model_ms.py --model Qwen/Qwen3-8B --dir /root/models/Qwen3-8B
PYTHONPATH=. python scripts/download_model_ms.py --model Qwen/Qwen3-0.6B --dir /root/models/Qwen3-0.6B
```

Hugging Face 镜像脚本：`backend/scripts/download_model.py`（默认 `HF_ENDPOINT=https://hf-mirror.com`）。

路径若不是 `/root/models`，改 `backend/configs/models.yaml` 里每个模型的 `path` 以及 `runtime.models_root`。

---

## 5. 环境变量与本地配置（多数不进 Git）

| 文件 / 变量 | 是否进 Git | 当前值 | 作用 |
|---|---|---|---|
| `agent-security-range/.env.local` | 否 | `NEXT_PUBLIC_API_BASE=` 留空；`BACKEND_ORIGIN=http://127.0.0.1:8801` | 浏览器同源请求 `/api`；Next rewrite 到后端 |
| `agent-security-range/.env.example` | 是 | 同上模板 | 拷贝成 `.env.local` |
| `CUDA_VISIBLE_DEVICES` | `run.sh` 默认 `0` | GPU 编号 |
| `PYTHON` | `run.sh` 默认 `/root/anaconda3/bin/python` | 后端解释器 |
| `PYTHONPATH` | `run.sh` 设为 backend 根 | 能 `import api` |
| `HF_ENDPOINT` | 下载脚本默认 hf-mirror | 国内拉 HF |
| `models.yaml` `openai_base_url` | `http://127.0.0.1:8001/v1` | 仅 vLLM 可选路径 |

`.gitignore` 还会排除：`.venv`、`node_modules`、`.next`、`.tools`、权重、`backend/data/experiments/*`、workspace 运行时邮件/文档副本。

---

## 6. 端口（前端反代方案）

以下为本地未提交的反代方案（只对外暴露前端）：

| 进程 | 监听 | 对外 |
|---|---|---|
| Next 前端 | **0.0.0.0:8800** | 只映射这一个公网端口 |
| FastAPI | **127.0.0.1:8801** | 不对外；由 Next `rewrites` 转发 `/api`、`/health`、`/docs` |
| vLLM（可选） | 0.0.0.0:**8001** | 本机推理，一般不映射 |

新机防火墙 / 安全组：**放行前端 8800**（或映射后的公网端口）。后端 8801 可只本机访问。

GitHub 上旧 README 仍可能写 `8000/3000`，以迁过去的 `run.sh` + `package.json` 为准。

---

## 7. 代码从哪来

```text
仓库：https://github.com/fictionqing/agent-security-range.git（私有）
远程 main 在整理本清单时的提交：8dab7ff（CI + 插件化）
本地可能还有未推送改动：反代端口、.env.example、pages.md 等
```

私有仓：新机要用有权限的 GitHub 账号，或 Deploy Key / PAT。

---

## 8. 新机推荐搭建顺序

### A. 只跑 Mock（验证 UI，无需 GPU / 权重）

```bash
git clone https://github.com/fictionqing/agent-security-range.git
cd agent-security-range   # 或目录名 range

# 后端
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# 把 run.sh 的 PYTHON 改成 "$(pwd)/.venv/bin/python"
./run.sh

# 前端（另开终端）
cd ../agent-security-range
cp .env.example .env.local
npm install
npm run dev
```

验收：

```bash
cd backend && PYTHONPATH=. python -m unittest tests.test_plugin_ablation
# 浏览器打开映射后的 8800；页面请求 /api 应被反代到 127.0.0.1:8801
```

### B. 再上真实 Qwen3-8B

1. 确认 `nvidia-smi` 正常、显存 ≥ 24GB
2. 安装 torch cu124 + transformers（见 [2.3](#23-真实模型额外依赖不在-requirementstxt-里)）
3. 放入 `/root/models/Qwen3-8B`（拷贝或下载）
4. 运行：

```bash
cd backend
PYTHONPATH=. python scripts/e2e_qwen3_8b.py
```

---

## 9. 当前机「已装但不必整机拷」的大目录

| 路径 | 约大小 | 要不要拷到新机 |
|---|---|---|
| 项目源码（不含 `node_modules`） | <1GB | 用 git，或连同未提交改动 rsync |
| `/root/anaconda3` | ~16GB | 不必；新机重装 Python 3.11 更快 |
| `/root/models/Qwen3-8B` + `Qwen3-0.6B` | ~17.5GB | **要拷或重下** |
| `agent-security-range/node_modules` | ~493MB | 不必，`npm install` |
| `.tools/node-v22.19.0-linux-x64` | 便携 Node 22 | 不必，新机装 Node 20/22 |
| `backend/.venv` | 空 | 不必 |

---

## 10. 新机 checklist

- [ ] Ubuntu 22.04 x86_64
- [ ] Git + curl + build-essential
- [ ] Python **3.11**
- [ ] `pip install -r backend/requirements.txt`
- [ ] Node **20 或 22** + `npm install`
- [ ] `.env.local`（`NEXT_PUBLIC_API_BASE` 留空，`BACKEND_ORIGIN=http://127.0.0.1:8801`）
- [ ] 后端 `127.0.0.1:8801`，前端 `0.0.0.0:8800`
- [ ] （可选 GPU）驱动 + `torch==2.5.1+cu124` + `transformers==5.17.0`
- [ ] （可选 GPU）`/root/models/Qwen3-8B` ~16GB
- [ ] `PYTHONPATH=. python -m unittest tests.test_plugin_ablation` 通过

只做 Mock 部署时，**不需要** CUDA、不需要 16GB 权重、不需要 vLLM、不需要 Anaconda 整包。

相关文档：[README.md](./README.md)、[CONTRIBUTING.md](./CONTRIBUTING.md)。
