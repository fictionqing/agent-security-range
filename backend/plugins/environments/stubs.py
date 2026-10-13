"""Offline environment placeholders. Implement these to bring a new sandbox online."""
from __future__ import annotations

from typing import Any

from plugins.protocols import EnvironmentPlugin, EpisodeContext


class _OfflineEnvironment(EnvironmentPlugin):
    status = "offline"

    def reset(self, ctx: EpisodeContext) -> Any:
        raise NotImplementedError(f"Environment {self.id} is not ready yet")

    def make_tools(self, state: Any) -> Any:
        raise NotImplementedError(f"Environment {self.id} is not ready yet")

    def tool_specs(self) -> list[dict[str, str]]:
        return []


class BrowserEnvironment(_OfflineEnvironment):
    id = "browser"
    name = "Browser"


class CodingEnvironment(_OfflineEnvironment):
    id = "coding"
    name = "Coding"


class FinanceEnvironment(_OfflineEnvironment):
    id = "finance"
    name = "Finance"
