# Agent Security Range

实验室智能体攻防实验基础设施。

## 当前进度

- ✅ Step 1：前端空壳 UI
- ✅ Step 2：模型运行环境（无 GPU）
- ✅ Step 3：Qwen3-8B 下载 + Registry/Adapter/Runtime 架构验证

权重路径：`/root/models/Qwen3-8B`（约 16.4GB）。完整推理需 A100/vLLM；本机仅验证软件链路。


## 技术栈

- Next.js 15 + React 19 + TypeScript + Tailwind
- FastAPI（`/root/range/backend`）

## 已实现页面

| 路由 | 说明 |
|---|---|
| `/dashboard` | Security Overview |
| `/experiments` | 实验列表 |
| `/models` | Model Registry（接后端） |
| `/agents` | Agent Library（优先后端） |
| `/runtime` | Agent Runtime 试跑 |
| `/attacks` | Attack Library |
| `/defenses` | Defense Library |
| `/environments` | Environment Library |
| `/traces` | Trace Viewer |
| `/reports` | Results |
| `/settings` | API / Inference 状态 |

## 启动

```bash
# 后端
cd /root/range/backend && ./run.sh

# 前端
export PATH="/root/range/.tools/node-v22.19.0-linux-x64/bin:$PATH"
cd /root/range/agent-security-range
npm run dev
```

- UI: http://localhost:3000  
- API: http://127.0.0.1:8000/docs  

`.env.local`：`NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000`
