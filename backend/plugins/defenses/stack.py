"""Composable DefenseStack built from YAML `layers` + middleware plugins."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from plugins.protocols import DefenseEvent, DefenseMiddleware

# Fallback if YAML has no `layers:` (must match historical ablation ids).
LAYERS_BY_ID: dict[str, frozenset[str]] = {
    "def-baseline": frozenset(),
    "def-input-filter": frozenset({"input"}),
    "def-tool-filter": frozenset({"tool"}),
    "def-output-filter": frozenset({"output"}),
    "def-memory-guard": frozenset({"memory"}),
    "def-combined": frozenset({"input", "tool", "output", "memory"}),
}

# Observation pipeline order (input before memory). Tool/output are no-ops here.
_OBSERVATION_ORDER = ("input", "tool", "memory", "output")
_TOOL_ORDER = ("tool", "input", "memory", "output")
_OUTPUT_ORDER = ("output", "input", "tool", "memory")

LAYER_PLUGINS: dict[str, str] = {
    "input": "plugins.defenses.input_guard:InputGuard",
    "tool": "plugins.defenses.tool_guard:ToolGuard",
    "memory": "plugins.defenses.memory_guard:MemoryGuard",
    "output": "plugins.defenses.output_guard:OutputGuard",
}


def _sorted_layers(layers: frozenset[str], order: tuple[str, ...]) -> list[str]:
    rank = {name: i for i, name in enumerate(order)}
    return sorted(layers, key=lambda n: rank.get(n, 99))


@dataclass
class DefenseStack:
    defense_id: str = "def-baseline"
    layers: frozenset[str] = field(default_factory=frozenset)
    events: list[DefenseEvent] = field(default_factory=list)
    middlewares: list[DefenseMiddleware] = field(default_factory=list)

    @classmethod
    def from_id(cls, defense_id: str | None) -> "DefenseStack":
        from plugins.registry import build_defense_stack

        return build_defense_stack(defense_id)

    @classmethod
    def from_layers(
        cls,
        defense_id: str,
        layers: frozenset[str],
        middlewares: list[DefenseMiddleware],
    ) -> "DefenseStack":
        stack = cls(defense_id=defense_id, layers=layers, middlewares=middlewares)
        for mw in stack.middlewares:
            mw.events = stack.events
        return stack

    @property
    def name(self) -> str:
        return self.defense_id

    def uses(self, layer: str) -> bool:
        return layer in self.layers

    def _by_layer(self) -> dict[str, DefenseMiddleware]:
        return {mw.layer: mw for mw in self.middlewares}

    def filter_observation(self, tool_name: str, observation: str) -> str:
        raw = observation
        text = observation
        by_layer = self._by_layer()
        for layer in _sorted_layers(self.layers, _OBSERVATION_ORDER):
            mw = by_layer.get(layer)
            if mw is None:
                continue
            text = mw.filter_observation(tool_name, text, raw)
        return text

    def check_tool_call(self, name: str, arguments: dict[str, Any]) -> DefenseEvent | None:
        by_layer = self._by_layer()
        for layer in _sorted_layers(self.layers, _TOOL_ORDER):
            mw = by_layer.get(layer)
            if mw is None:
                continue
            ev = mw.check_tool_call(name, arguments)
            if ev:
                return ev
        return None

    def filter_output(self, text: str) -> str:
        out = text
        by_layer = self._by_layer()
        for layer in _sorted_layers(self.layers, _OUTPUT_ORDER):
            mw = by_layer.get(layer)
            if mw is None:
                continue
            out = mw.filter_output(out)
        return out

    def summary(self) -> dict[str, Any]:
        return {
            "defense_id": self.defense_id,
            "layers": sorted(self.layers),
            "events": [
                {
                    "layer": e.layer,
                    "action": e.action,
                    "reason": e.reason,
                    "tool_name": e.tool_name,
                }
                for e in self.events
            ],
            "blocked": any(e.action == "blocked" for e in self.events),
            "redacted": any(e.action in ("redacted", "isolated") for e in self.events),
        }
