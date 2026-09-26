from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from models.schemas import AgentSpec, ModelBackend, ModelRecord, ModelStatus
from paths import AGENTS_CONFIG, MODELS_CONFIG


def _load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


class ModelRegistry:
    """Central registry for local / remote models (not bound to Agent)."""

    def __init__(self, config_path: Path = MODELS_CONFIG) -> None:
        self.config_path = config_path
        data = _load_yaml(config_path)
        self.runtime_cfg = data.get("runtime", {})
        self.models_root = Path(self.runtime_cfg.get("models_root", "/root/models"))
        self.default_model_id = self.runtime_cfg.get("default_model_id", "mock-tool-agent")
        self.openai_base_url = self.runtime_cfg.get(
            "openai_base_url", "http://127.0.0.1:8001/v1"
        )
        self.openai_api_key = self.runtime_cfg.get("openai_api_key", "EMPTY")
        self.max_steps = int(self.runtime_cfg.get("max_steps", 8))
        self._models: dict[str, ModelRecord] = {}
        for item in data.get("models", []):
            record = ModelRecord.model_validate(item)
            self._models[record.id] = self.refresh_model(record)

    def refresh_model(self, record: ModelRecord) -> ModelRecord:
        if record.backend == ModelBackend.mock:
            record.status = ModelStatus.ready
            record.weights_present = True
            record.base_url = None
            return record

        path = Path(record.path) if record.path else None
        weights_present = bool(
            path
            and path.exists()
            and (
                any(path.glob("model-*.safetensors"))
                or any(path.glob("*.safetensors"))
                or (path / "pytorch_model.bin").exists()
                or (path / "model.safetensors").exists()
            )
        )
        # Also accept incomplete download that at least has config + tokenizer
        config_present = bool(path and (path / "config.json").exists())
        record.weights_present = weights_present

        if record.backend == ModelBackend.transformers:
            record.base_url = None
            if weights_present:
                # 8B on tiny RAM stays "offline" for serving unless explicitly ready
                if "8B" in (record.params or "") or "8b" in record.id:
                    # weights on disk = download done; inference may still need GPU
                    record.status = ModelStatus.ready if weights_present else ModelStatus.downloading
                else:
                    record.status = ModelStatus.ready
            elif config_present:
                record.status = ModelStatus.downloading
            else:
                record.status = ModelStatus.offline
            return record

        record.base_url = self.openai_base_url
        if not weights_present and record.status == ModelStatus.ready:
            record.status = ModelStatus.offline
        return record

    def list_models(self) -> list[ModelRecord]:
        return [self.refresh_model(m.model_copy()) for m in self._models.values()]

    def get(self, model_id: str) -> ModelRecord:
        if model_id not in self._models:
            raise KeyError(f"Unknown model_id: {model_id}")
        return self.refresh_model(self._models[model_id].model_copy())

    def ensure_model_dirs(self) -> dict[str, str]:
        created: dict[str, str] = {}
        for record in self._models.values():
            if not record.path:
                continue
            path = Path(record.path)
            path.mkdir(parents=True, exist_ok=True)
            readme = path / "README.md"
            if not readme.exists():
                readme.write_text(
                    f"# {record.name}\n\n"
                    f"HF: `{record.hf_id}`\n\n"
                    "Download weights here (no GPU required for download).\n"
                    "Serve later via vLLM OpenAI-compatible API.\n",
                    encoding="utf-8",
                )
            created[record.id] = str(path)
        self.models_root.mkdir(parents=True, exist_ok=True)
        return created


class AgentRegistry:
    def __init__(
        self,
        model_registry: ModelRegistry,
        config_path: Path = AGENTS_CONFIG,
    ) -> None:
        self.model_registry = model_registry
        data = _load_yaml(config_path)
        self._agents: dict[str, AgentSpec] = {}
        for item in data.get("agents", []):
            spec = AgentSpec.model_validate(item)
            self._agents[spec.id] = spec

    def list_agents(self) -> list[AgentSpec]:
        return [self._enrich(a) for a in self._agents.values()]

    def get(self, agent_id: str) -> AgentSpec:
        if agent_id not in self._agents:
            raise KeyError(f"Unknown agent_id: {agent_id}")
        return self._enrich(self._agents[agent_id])

    def _enrich(self, spec: AgentSpec) -> AgentSpec:
        out = spec.model_copy(deep=True)
        model = self.model_registry.get(spec.model_id)
        out.model = model
        out.status = model.status
        return out
