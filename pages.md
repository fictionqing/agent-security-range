1. 克隆仓库

git clone https://github.com/fictionqing/agent-security-range.git
cd agent-security-range
2. 本地启动 Mock 版本
Mock 不需要模型权重或 GPU。

后端：

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./run.sh
前端另开终端：

cd agent-security-range
cp .env.example .env.local
npm install
npm run dev
访问：

前端：http://127.0.0.1:3000
API：http://127.0.0.1:8000/docs
模型权重不在 GitHub 中。只有需要跑真实 Qwen 的成员，才单独下载模型并配置 MODELS_ROOT。

3. 每个任务单独建分支
开始工作前：

git switch main
git pull --ff-only
git switch -c attack/direct-prompt-injection
推荐命名：

attack/<方法>
defense/<方法>
environment/<环境>
evaluator/<指标>
fix/<问题>
docs/<内容>
不要几个人共用同一个开发分支。

4. 开发与提交
git status
git diff
git add backend/configs/attacks.yaml backend/attacks/...
git commit -m "feat(attack): implement direct prompt injection"
git push -u origin attack/direct-prompt-injection
提交信息建议：

feat(attack): add tool argument injection
feat(defense): add spotlighting middleware
test(evaluator): cover unauthorized transfer
docs(paper): document threat model and citation
fix(runtime): preserve utility after blocked tool call
5. 创建 Pull Request
PR 描述应包括：

论文/方法：
Threat model：
实现位置：
攻击成功条件：
Utility 条件：
实验配置：
验证命令：
实验结果：
已知限制：
每个 PR 尽量只包含一个攻防方法，不要同时修改无关代码。

6. 合并前同步 main
git fetch origin
git rebase origin/main
解决冲突后：

git add <冲突文件>
git rebase --continue
git push --force-with-lease
--force-with-lease 仅限自己的功能分支，禁止用于 main。

7. PR 的完成标准
一个论文方法只有满足以下条件才算完成：

方法配置已注册
有独立实现，不只是 YAML 占位
至少包含正常任务和攻击任务
定义明确的 ground-truth
至少有一个自动化测试
可以由 Mock Agent 运行
有真实模型结果或明确标注“尚未验证”
Trace 中能看到关键攻防事件
README 或方法文档包含论文引用、假设和局限

8. GitHub CI
仓库已配置 GitHub Actions（`.github/workflows/ci.yml`）。每个 PR 会自动跑：

- `backend-tests`：Mock PI + defense ablation 数字锁
- `frontend-typecheck`：前端 TypeScript 检查

合入 `main` 前这两个检查需要是绿色。本地等价命令：

```bash
cd backend
PYTHONPATH=. python -m unittest tests.test_plugin_ablation
```
