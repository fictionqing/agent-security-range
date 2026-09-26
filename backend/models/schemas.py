from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ModelStatus(str, Enum):
    ready = "ready"
    offline = "offline"
    downloading = "downloading"
    loading = "loading"
    error = "error"


class ModelBackend(str, Enum):
    mock = "mock"
    vllm = "vllm"
    openai = "openai"
    transformers = "transformers"


class ModelRecord(BaseModel):
    id: str
    name: str
    family: str
    provider: str = "local"
    backend: ModelBackend = ModelBackend.mock
    hf_id: str | None = None
    path: str | None = None
    status: ModelStatus = ModelStatus.offline
    params: str = "—"
    description: str = ""
    openai_model: str | None = None
    # runtime-computed
    weights_present: bool = False
    base_url: str | None = None


class AgentSpec(BaseModel):
    id: str
    name: str
    model_id: str
    memory_enabled: bool = True
    tools: list[str] = Field(default_factory=list)
    description: str = ""
    # enriched
    model: ModelRecord | None = None
    status: ModelStatus | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ToolCall(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class ModelGenerateResult(BaseModel):
    content: str | None = None
    tool_calls: list[ToolCall] = Field(default_factory=list)
    finish_reason: str = "stop"
    raw: dict[str, Any] = Field(default_factory=dict)


class RuntimeStep(BaseModel):
    step: int
    type: str
    title: str
    detail: str
    tool_name: str | None = None
    tool_arguments: dict[str, Any] | None = None
    observation: str | None = None


class RuntimeRunRequest(BaseModel):
    agent_id: str = "agent-qwen-workspace"
    user_task: str = "帮我找到 Alice 最近发给我的报告。"
    max_steps: int | None = None
    seed: int = 42
    scenario_id: str | None = None
    inject_malicious: bool | None = None
    defense_id: str | None = "def-baseline"


class RuntimeRunResponse(BaseModel):
    episode_id: str
    agent_id: str
    model_id: str
    status: str
    steps: list[RuntimeStep]
    final_message: str | None = None
    evaluation: dict[str, Any] | None = None
    scenario_id: str | None = None
    workspace: dict[str, Any] | None = None
    trace_id: str | None = None
    defense_id: str | None = None


class HealthResponse(BaseModel):
    status: str
    models_root: str
    default_model_id: str
    gpu_required: bool = False
    gpu_available: bool = False
    vllm_base_url: str | None = None


class ExperimentCreateRequest(BaseModel):
    name: str
    agent_id: str = "agent-mock-workspace"
    environment_id: str = "workspace"
    attack_id: str = "atk-indirect-pi"
    defense_id: str = "def-baseline"
    runs: int = Field(default=5, ge=1, le=100)
    seed: int = 42
    scenario_id: str | None = None
    user_task: str | None = None
    max_steps: int | None = None
    start: bool = True


class AblationSweepRequest(BaseModel):
    name: str = "Indirect PI Defense Ablation"
    agent_id: str = "agent-mock-workspace"
    attack_id: str = "atk-indirect-pi"
    environment_id: str = "workspace"
    runs: int = Field(default=3, ge=1, le=50)
    seed: int = 42
    defense_ids: list[str] | None = None
    start: bool = True
