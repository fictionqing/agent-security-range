from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from experiments.catalog import list_attacks, list_defenses
from experiments.manager import ExperimentManager
from environments.scenarios import load_scenarios, scenario_summary, get_scenario
from environments.workspace import WorkspaceToolRuntime, build_workspace
from plugins.registry import REGISTRY
from models.registry import AgentRegistry, ModelRegistry
from models.schemas import (
    AblationSweepRequest,
    ExperimentCreateRequest,
    HealthResponse,
    RuntimeRunRequest,
    RuntimeRunResponse,
)
from runtime.agent_runtime import AgentRuntime

model_registry = ModelRegistry()
agent_registry = AgentRegistry(model_registry)
agent_runtime = AgentRuntime(model_registry, agent_registry)
experiment_manager = ExperimentManager(agent_runtime, model_registry, agent_registry)

app = FastAPI(
    title="Agent Security Range API",
    description="Model Registry + Adapter + Agent Runtime + Experiment Manager + Trace Store",
    version="0.6.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    model_registry.ensure_model_dirs()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    gpu_available = False
    try:
        import torch

        gpu_available = bool(torch.cuda.is_available())
    except Exception:
        gpu_available = False
    return HealthResponse(
        status="ok",
        models_root=str(model_registry.models_root),
        default_model_id=model_registry.default_model_id,
        gpu_required=False,
        gpu_available=gpu_available,
        vllm_base_url=model_registry.openai_base_url,
    )


@app.get("/api/models")
def list_models():
    return {"items": [m.model_dump() for m in model_registry.list_models()]}


@app.get("/api/models/{model_id}")
def get_model(model_id: str):
    try:
        return model_registry.get(model_id).model_dump()
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/models/ensure-dirs")
def ensure_dirs():
    return {"created": model_registry.ensure_model_dirs()}


@app.get("/api/agents")
def list_agents():
    return {"items": [a.model_dump() for a in agent_registry.list_agents()]}


@app.get("/api/agents/{agent_id}")
def get_agent(agent_id: str):
    try:
        return agent_registry.get(agent_id).model_dump()
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/environments")
def list_environments():
    """Environment library + registered tools + scenarios (plugin catalog)."""
    return {"items": REGISTRY.list_environment_public()}


@app.get("/api/environments/workspace/snapshot")
def workspace_snapshot(
    scenario_id: str | None = Query(None),
    inject_malicious: bool = Query(False),
):
    """Return a fresh workspace snapshot (optionally with PI injection)."""
    injection_payload = None
    sid = scenario_id
    if sid:
        try:
            sc = get_scenario(sid)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        inject_malicious = bool(sc.get("inject_malicious", inject_malicious))
        injection_payload = sc.get("injection_payload")
    state = build_workspace(
        inject_malicious=inject_malicious,
        injection_payload=injection_payload,
        scenario_id=sid,
    )
    return {
        "environment": "workspace",
        "scenario_id": sid,
        "tools": WorkspaceToolRuntime.TOOL_SPECS,
        "state": state.snapshot(include_bodies=True),
    }


@app.get("/api/scenarios")
def list_scenarios():
    return {"items": [scenario_summary(s) for s in load_scenarios()]}


@app.get("/api/attacks")
def api_list_attacks():
    return {"items": list_attacks()}


@app.get("/api/defenses")
def api_list_defenses():
    return {"items": list_defenses()}


@app.get("/api/plugins")
def api_list_plugins():
    """Catalog of registered plugin specs (for collaborators)."""
    return {
        "environments": REGISTRY.list_environment_public(),
        "attacks": list_attacks(),
        "defenses": list_defenses(),
    }


@app.get("/api/experiments")
def api_list_experiments():
    return {"items": experiment_manager.store.list_experiments()}


@app.post("/api/experiments")
def api_create_experiment(body: ExperimentCreateRequest):
    try:
        record = experiment_manager.create(
            name=body.name,
            agent_id=body.agent_id,
            environment_id=body.environment_id,
            attack_id=body.attack_id,
            defense_id=body.defense_id,
            runs=body.runs,
            seed=body.seed,
            scenario_id=body.scenario_id,
            user_task=body.user_task,
            max_steps=body.max_steps,
        )
        if body.start:
            record = experiment_manager.start(record["id"], background=True)
        return record
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.post("/api/experiments/ablation")
def api_ablation_sweep(body: AblationSweepRequest):
    try:
        return experiment_manager.create_ablation_sweep(
            name=body.name,
            agent_id=body.agent_id,
            attack_id=body.attack_id,
            environment_id=body.environment_id,
            runs=body.runs,
            seed=body.seed,
            defense_ids=body.defense_ids,
            start=body.start,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.get("/api/experiments/{exp_id}")
def api_get_experiment(exp_id: str):
    try:
        return experiment_manager.store.get_experiment(exp_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/experiments/{exp_id}/start")
def api_start_experiment(exp_id: str):
    try:
        return experiment_manager.start(exp_id, background=True)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.get("/api/traces")
def api_list_traces(experiment_id: str | None = Query(None)):
    try:
        return {"items": experiment_manager.store.list_traces(experiment_id)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/traces/{trace_id}")
def api_get_trace(trace_id: str):
    try:
        return experiment_manager.store.get_trace(trace_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/reports")
def api_reports():
    return experiment_manager.reports()


@app.get("/api/dashboard")
def api_dashboard():
    return experiment_manager.dashboard()


@app.post("/api/runtime/run", response_model=RuntimeRunResponse)
def runtime_run(
    body: RuntimeRunRequest,
    inject_malicious: bool | None = Query(
        None, description="Override Indirect PI injection (else use body/scenario)"
    ),
    scenario_id: str | None = Query(None, description="Scenario id override"),
):
    try:
        result = agent_runtime.run(
            body,
            inject_malicious=inject_malicious,
            scenario_id=scenario_id or body.scenario_id,
            defense_id=body.defense_id,
        )
        try:
            trace = experiment_manager.persist_runtime_run(
                result, user_task=body.user_task
            )
            result.trace_id = trace["id"]
        except Exception:
            # Persistence must not break interactive runtime.
            pass
        return result
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/api/runtime/chat")
def runtime_chat(payload: dict):
    model_id = payload.get("model_id") or model_registry.default_model_id
    messages = payload.get("messages") or []
    tools = payload.get("tools")
    try:
        return agent_runtime.chat(model_id=model_id, messages=messages, tools=tools)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
