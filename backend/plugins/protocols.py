"""Plugin protocols for Attack / Defense / Environment / Evaluator.

组员实现论文方法时，按这些接口写类，再在 YAML 里登记 `plugin:` 即可接入
Runtime / Experiment Manager，不必改核心循环。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class DefenseEvent:
    layer: str
    action: str  # redacted | blocked | isolated
    reason: str
    tool_name: str | None = None


@dataclass
class EpisodeContext:
    """One episode's resolved knobs. Runtime fills this before plugins run."""

    user_task: str
    environment_id: str = "workspace"
    scenario_id: str | None = None
    attack_id: str | None = None
    defense_id: str = "def-baseline"
    inject_malicious: bool = False
    injection_payload: str | None = None
    scenario: dict[str, Any] = field(default_factory=dict)
    seed: int = 42


class EnvironmentPlugin(ABC):
    """Stateful sandbox: reset seed world, expose tools, snapshot for traces."""

    id: str
    name: str
    status: str = "ready"

    @abstractmethod
    def reset(self, ctx: EpisodeContext) -> Any:
        """Return a fresh environment state for this episode."""

    @abstractmethod
    def make_tools(self, state: Any) -> Any:
        """Return an object with `.available()` and `.execute(name, arguments)`."""

    def tool_hint(self) -> str:
        return ""

    def tool_specs(self) -> list[dict[str, str]]:
        return []

    def snapshot(self, state: Any, *, include_bodies: bool = False) -> dict[str, Any]:
        snap = getattr(state, "snapshot", None)
        if callable(snap):
            return snap(include_bodies=include_bodies)
        return {}


class AttackPlugin(ABC):
    """Mutate the environment / task so the episode contains an attack."""

    id: str

    def apply(self, state: Any, ctx: EpisodeContext) -> Any:
        """Default: no mutation (control / baseline)."""
        return state

    def mutate_user_task(self, user_task: str, ctx: EpisodeContext) -> str:
        return user_task


class DefenseMiddleware(ABC):
    """One ablation layer. DefenseStack composes several of these."""

    layer: str

    def __init__(self, events: list[DefenseEvent] | None = None) -> None:
        self.events: list[DefenseEvent] = events if events is not None else []

    def check_tool_call(
        self, name: str, arguments: dict[str, Any]
    ) -> DefenseEvent | None:
        return None

    def filter_observation(self, tool_name: str, text: str, raw: str) -> str:
        return text

    def filter_output(self, text: str) -> str:
        return text


class EvaluatorPlugin(ABC):
    """Ground-truth scoring for an environment family."""

    id: str

    @abstractmethod
    def evaluate(
        self,
        *,
        state: Any,
        steps: list[Any],
        user_task: str,
        inject_malicious: bool,
        defense: dict[str, Any] | None = None,
    ) -> Any:
        """Return an object with `.as_dict()` and `.unauthorized_exfil`."""
