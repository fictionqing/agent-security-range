"""Load Attack / Defense / Environment / Evaluator plugins from YAML `plugin:` fields."""
from __future__ import annotations

import importlib
from typing import Any

from plugins.defenses.stack import LAYER_PLUGINS, LAYERS_BY_ID, DefenseStack
from plugins.protocols import (
    AttackPlugin,
    DefenseMiddleware,
    EnvironmentPlugin,
    EvaluatorPlugin,
)


def import_plugin(spec: str) -> Any:
    """`module.path:ClassName` → class object."""
    if ":" not in spec:
        raise ValueError(f"Invalid plugin spec (want module:Class): {spec}")
    module_name, class_name = spec.split(":", 1)
    module = importlib.import_module(module_name)
    try:
        return getattr(module, class_name)
    except AttributeError as exc:
        raise KeyError(f"Plugin class {class_name} not in {module_name}") from exc


def _catalog():
    from experiments import catalog

    return catalog


class PluginRegistry:
    def get_environment(self, environment_id: str) -> EnvironmentPlugin:
        spec = _catalog().get_environment(environment_id)
        plugin_spec = spec.get("plugin")
        if not plugin_spec:
            raise KeyError(f"Environment {environment_id} has no plugin:")
        cls = import_plugin(plugin_spec)
        env: EnvironmentPlugin = cls()
        env.status = spec.get("status", getattr(env, "status", "offline"))
        return env

    def get_attack(self, attack_id: str) -> AttackPlugin:
        spec = _catalog().get_attack(attack_id)
        plugin_spec = spec.get("plugin")
        if not plugin_spec:
            raise KeyError(f"Attack {attack_id} has no plugin:")
        cls = import_plugin(plugin_spec)
        return cls()

    def get_evaluator(self, environment_id: str) -> EvaluatorPlugin:
        spec = _catalog().get_environment(environment_id)
        plugin_spec = spec.get("evaluator")
        if not plugin_spec:
            raise KeyError(f"Environment {environment_id} has no evaluator:")
        cls = import_plugin(plugin_spec)
        return cls()

    def build_defense(self, defense_id: str | None) -> DefenseStack:
        return build_defense_stack(defense_id)

    def list_environment_public(self) -> list[dict[str, Any]]:
        from environments.scenarios import load_scenarios, scenario_summary

        items: list[dict[str, Any]] = []
        for spec in _catalog().list_environments():
            env_id = spec["id"]
            scenarios = [
                scenario_summary(s)
                for s in load_scenarios()
                if s.get("environment", "workspace") == env_id
            ]
            tools: list[dict[str, str]] = []
            if spec.get("status") == "ready" and spec.get("plugin"):
                try:
                    tools = self.get_environment(env_id).tool_specs()
                except Exception:
                    tools = []
            items.append(
                {
                    "id": env_id,
                    "name": spec.get("name", env_id),
                    "type": env_id,
                    "status": spec.get("status", "offline"),
                    "description": spec.get("description", ""),
                    "tools": [t["name"] for t in tools],
                    "tool_specs": tools,
                    "scenarios": scenarios,
                    "plugin": spec.get("plugin"),
                    "evaluator": spec.get("evaluator"),
                }
            )
        return items

    def ready_environment_count(self) -> int:
        return sum(
            1 for e in _catalog().list_environments() if e.get("status") == "ready"
        )


def build_defense_stack(defense_id: str | None) -> DefenseStack:
    did = defense_id or "def-baseline"
    try:
        spec = _catalog().get_defense(did)
    except KeyError:
        spec = None
        if did not in LAYERS_BY_ID:
            raise KeyError(f"Unknown defense: {did}") from None

    if spec is not None:
        raw_layers = spec.get("layers")
        if raw_layers is None:
            layers = LAYERS_BY_ID.get(did)
            if layers is None:
                raise KeyError(f"Unknown defense: {did}")
        else:
            layers = frozenset(str(x) for x in raw_layers)
    else:
        layers = LAYERS_BY_ID[did]
        spec = {}

    extra_plugin = spec.get("plugin") if spec else None
    middlewares: list[DefenseMiddleware] = []
    used_layers: set[str] = set(layers)

    for layer in layers:
        plugin_spec = LAYER_PLUGINS.get(layer)
        if not plugin_spec:
            raise KeyError(f"No built-in middleware for layer {layer!r}")
        cls = import_plugin(plugin_spec)
        middlewares.append(cls())

    if extra_plugin:
        cls = import_plugin(extra_plugin)
        extra = cls()
        if getattr(extra, "layer", None) is None:
            extra.layer = extra_plugin.rsplit(":", 1)[-1]
        if extra.layer not in used_layers:
            used_layers.add(extra.layer)
        middlewares.append(extra)

    return DefenseStack.from_layers(did, frozenset(used_layers), middlewares)


REGISTRY = PluginRegistry()
