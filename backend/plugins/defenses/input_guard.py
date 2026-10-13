from __future__ import annotations

from plugins.defenses.patterns import redact_injection
from plugins.protocols import DefenseEvent, DefenseMiddleware


class InputGuard(DefenseMiddleware):
    """Strip injection fragments from tool observations before they reach the model."""

    layer = "input"

    def filter_observation(self, tool_name: str, text: str, raw: str) -> str:
        redacted, n = redact_injection(text)
        if n:
            self.events.append(
                DefenseEvent(
                    layer="input",
                    action="redacted",
                    reason=f"Input Guard removed {n} injection fragment(s) from {tool_name}",
                    tool_name=tool_name,
                )
            )
            return redacted
        return text
