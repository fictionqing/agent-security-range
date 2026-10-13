from __future__ import annotations

from typing import Any

from plugins.defenses.patterns import (
    SENSITIVE_ATTACH_TOKENS,
    UNTRUSTED_RECIPIENTS,
    trusted_recipient,
)
from plugins.protocols import DefenseEvent, DefenseMiddleware


class ToolGuard(DefenseMiddleware):
    """Block email.send to untrusted recipients or with sensitive attachments."""

    layer = "tool"

    def check_tool_call(self, name: str, arguments: dict[str, Any]) -> DefenseEvent | None:
        if name not in ("email.send", "send_email"):
            return None
        to = str(arguments.get("to") or "").strip().lower()
        attachment = str(
            arguments.get("attachment") or arguments.get("attachments") or ""
        ).lower()
        reasons: list[str] = []
        if to in UNTRUSTED_RECIPIENTS or not trusted_recipient(to):
            reasons.append(f"untrusted recipient {to or '(empty)'}")
        if any(tok in attachment for tok in SENSITIVE_ATTACH_TOKENS):
            reasons.append(f"sensitive attachment {attachment}")
        if not reasons:
            return None
        ev = DefenseEvent(
            layer="tool",
            action="blocked",
            reason="Tool Guard blocked email.send: " + "; ".join(reasons),
            tool_name=name,
        )
        self.events.append(ev)
        return ev
