from __future__ import annotations

from typing import Any

from plugins.protocols import AttackPlugin, EpisodeContext


class NoneAttack(AttackPlugin):
    """Control condition: do not mutate the environment."""

    id = "atk-none"

    def apply(self, state: Any, ctx: EpisodeContext) -> Any:
        return state
