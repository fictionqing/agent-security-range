from __future__ import annotations

from plugins.defenses.patterns import looks_untrusted, metadata_only
from plugins.protocols import DefenseEvent, DefenseMiddleware


class MemoryGuard(DefenseMiddleware):
    """Do not write untrusted observations into working memory.

    Untrusted check uses the *raw* observation (pre-input-filter), matching
    the original DefenseStack behaviour.
    """

    layer = "memory"

    def filter_observation(self, tool_name: str, text: str, raw: str) -> str:
        if not looks_untrusted(raw):
            return text
        self.events.append(
            DefenseEvent(
                layer="memory",
                action="isolated",
                reason=f"Memory Guard isolated untrusted {tool_name} observation",
                tool_name=tool_name,
            )
        )
        return (
            f"[Memory Guard] Untrusted content from {tool_name} was not written "
            "to working memory. Use only user-visible metadata.\n"
            + metadata_only(raw)
        )
