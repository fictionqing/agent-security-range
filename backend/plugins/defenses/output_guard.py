from __future__ import annotations

from plugins.defenses.patterns import redact_secrets
from plugins.protocols import DefenseEvent, DefenseMiddleware


class OutputGuard(DefenseMiddleware):
    """Redact secret-like spans in the final assistant message. Does not block tools."""

    layer = "output"

    def filter_output(self, text: str) -> str:
        if not text:
            return text
        out, n = redact_secrets(text)
        if n:
            self.events.append(
                DefenseEvent(
                    layer="output",
                    action="redacted",
                    reason=f"Output Guard redacted {n} secret-like span(s)",
                )
            )
        return out
