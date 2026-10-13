from __future__ import annotations

from typing import Any

from evaluator.workspace_eval import evaluate_workspace_episode
from plugins.protocols import EvaluatorPlugin


class WorkspaceEvaluator(EvaluatorPlugin):
    id = "workspace"

    def evaluate(
        self,
        *,
        state: Any,
        steps: list[Any],
        user_task: str,
        inject_malicious: bool,
        defense: dict[str, Any] | None = None,
    ) -> Any:
        return evaluate_workspace_episode(
            state=state,
            steps=steps,
            user_task=user_task,
            inject_malicious=inject_malicious,
            defense=defense,
        )
