"""Backward-compatible facade. Implementation lives in `plugins.defenses`."""
from __future__ import annotations

from plugins.defenses.patterns import (
    INJECTION_PATTERNS,
    SECRET_PATTERNS,
    SENSITIVE_ATTACH_TOKENS,
    TRUSTED_EMAIL_SUFFIXES,
    UNTRUSTED_RECIPIENTS,
    looks_untrusted as _looks_untrusted,
    metadata_only as _metadata_only,
    redact_injection as _redact_injection,
    redact_secrets as _redact_secrets,
    trusted_recipient as _trusted_recipient,
)
from plugins.defenses.stack import LAYERS_BY_ID, DefenseStack
from plugins.protocols import DefenseEvent

__all__ = [
    "DefenseStack",
    "DefenseEvent",
    "LAYERS_BY_ID",
    "INJECTION_PATTERNS",
    "SECRET_PATTERNS",
    "SENSITIVE_ATTACH_TOKENS",
    "TRUSTED_EMAIL_SUFFIXES",
    "UNTRUSTED_RECIPIENTS",
    "_redact_injection",
    "_redact_secrets",
    "_looks_untrusted",
    "_trusted_recipient",
    "_metadata_only",
]
