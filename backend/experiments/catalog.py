"""Attack / Defense catalogs (YAML). Only ready items can be scheduled."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

CONFIGS = Path(__file__).resolve().parents[1] / "configs"

ENV_NAMES = {
    "workspace": "Workspace",
    "env-workspace": "Workspace",
    "browser": "Browser",
    "coding": "Coding",
    "finance": "Finance",
}

ENV_IDS = {
    "workspace": "workspace",
    "env-workspace": "workspace",
    "browser": "browser",
    "coding": "coding",
    "finance": "finance",
}


def _load(name: str, key: str) -> list[dict[str, Any]]:
    path = CONFIGS / name
    if not path.exists():
        return []
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return list(data.get(key) or [])


def list_attacks() -> list[dict[str, Any]]:
    return _load("attacks.yaml", "attacks")


def get_attack(attack_id: str) -> dict[str, Any]:
    for a in list_attacks():
        if a.get("id") == attack_id:
            return a
    raise KeyError(f"Unknown attack: {attack_id}")


def list_defenses() -> list[dict[str, Any]]:
    return _load("defenses.yaml", "defenses")


def get_defense(defense_id: str) -> dict[str, Any]:
    for d in list_defenses():
        if d.get("id") == defense_id:
            return d
    raise KeyError(f"Unknown defense: {defense_id}")


def normalize_environment_id(environment_id: str) -> str:
    if environment_id not in ENV_IDS:
        raise KeyError(f"Unknown environment: {environment_id}")
    return ENV_IDS[environment_id]


def environment_name(environment_id: str) -> str:
    return ENV_NAMES.get(environment_id, environment_id)
