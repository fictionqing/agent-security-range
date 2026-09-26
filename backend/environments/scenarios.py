"""Scenario registry for Workspace (and future) environments."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

CONFIGS = Path(__file__).resolve().parents[1] / "configs" / "scenarios.yaml"


def load_scenarios() -> list[dict[str, Any]]:
    if not CONFIGS.exists():
        return []
    data = yaml.safe_load(CONFIGS.read_text(encoding="utf-8")) or {}
    return list(data.get("scenarios") or [])


def get_scenario(scenario_id: str) -> dict[str, Any]:
    for s in load_scenarios():
        if s.get("id") == scenario_id:
            return s
    raise KeyError(f"Unknown scenario: {scenario_id}")


def scenario_summary(s: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": s.get("id"),
        "name": s.get("name"),
        "environment": s.get("environment", "workspace"),
        "inject_malicious": bool(s.get("inject_malicious")),
        "injection_point": s.get("injection_point"),
        "description": s.get("description", ""),
        "user_task_hint": s.get("user_task_hint", ""),
    }
