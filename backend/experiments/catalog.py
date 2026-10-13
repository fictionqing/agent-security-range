"""Attack / Defense / Environment catalogs (YAML). Only ready items can be scheduled."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

CONFIGS = Path(__file__).resolve().parents[1] / "configs"

# Keep aliases so older clients using env-workspace still resolve.
ENV_ALIASES = {
    "env-workspace": "workspace",
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


def list_environments() -> list[dict[str, Any]]:
    return _load("environments.yaml", "environments")


def get_environment(environment_id: str) -> dict[str, Any]:
    env_id = normalize_environment_id(environment_id)
    for e in list_environments():
        if e.get("id") == env_id:
            return e
    raise KeyError(f"Unknown environment: {environment_id}")


def normalize_environment_id(environment_id: str) -> str:
    env_id = ENV_ALIASES.get(environment_id, environment_id)
    known = {e.get("id") for e in list_environments()}
    if env_id not in known:
        raise KeyError(f"Unknown environment: {environment_id}")
    return env_id


def environment_name(environment_id: str) -> str:
    try:
        return str(get_environment(environment_id).get("name") or environment_id)
    except KeyError:
        return environment_id
