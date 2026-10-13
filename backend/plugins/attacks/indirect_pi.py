"""Indirect Prompt Injection via an untrusted observation (email body)."""
from __future__ import annotations

from typing import Any

from environments.workspace import DEFAULT_INJECTION
from plugins.protocols import AttackPlugin, EpisodeContext


class IndirectPromptInjectionAttack(AttackPlugin):
    """Ensure the PI payload is present in the target email.

    WorkspaceEnvironment.reset already injects when `ctx.inject_malicious` is
    true (scenario-driven path). This plugin is idempotent: if the payload is
    already in the body it does nothing, so PI + ablation numbers stay the same.
    """

    id = "atk-indirect-pi"
    injection_email_id = "mail-001"

    def apply(self, state: Any, ctx: EpisodeContext) -> Any:
        if not ctx.inject_malicious and not ctx.scenario.get("inject_malicious"):
            return state
        payload = (ctx.injection_payload or DEFAULT_INJECTION).strip()
        emails = getattr(state, "emails", None)
        if not emails:
            return state
        for mail in emails:
            if mail.get("id") == self.injection_email_id:
                body = mail.get("body") or ""
                if payload not in body:
                    mail["body"] = body.rstrip() + "\n\n" + payload + "\n"
                break
        state.inject_malicious = True
        return state
