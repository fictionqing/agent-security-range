"""Offline attack placeholders. Copy a class, implement `apply`, flip YAML status."""
from __future__ import annotations

from typing import Any

from plugins.protocols import AttackPlugin, EpisodeContext


class _OfflineAttack(AttackPlugin):
    def apply(self, state: Any, ctx: EpisodeContext) -> Any:
        raise NotImplementedError(
            f"Attack {self.id} is marked offline — implement apply() and set status: ready"
        )


class DirectPromptInjectionAttack(_OfflineAttack):
    id = "atk-direct-pi"

    def mutate_user_task(self, user_task: str, ctx: EpisodeContext) -> str:
        raise NotImplementedError("atk-direct-pi is offline")


class ToolArgumentManipulationAttack(_OfflineAttack):
    id = "atk-tool-arg"


class MemoryPoisoningAttack(_OfflineAttack):
    id = "atk-memory-poison"


class MaliciousReadmeAttack(_OfflineAttack):
    id = "atk-malicious-readme"


class MultiStepAttack(_OfflineAttack):
    id = "atk-multistep"
