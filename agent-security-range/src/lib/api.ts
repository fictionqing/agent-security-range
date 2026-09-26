import type {
  Agent,
  Attack,
  DashboardMetrics,
  Defense,
  Environment,
  Experiment,
  ModelRecord,
  RuntimeRunResponse,
  ScenarioSummary,
  TraceEpisode,
  TraceSummary,
  WorkspaceSnapshot,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function mapExperiment(e: Record<string, unknown>): Experiment {
  return {
    id: String(e.id),
    name: String(e.name ?? ""),
    agentId: String(e.agent_id ?? e.agentId ?? ""),
    agentName: String(e.agent_name ?? e.agentName ?? "—"),
    environmentId: String(e.environment_id ?? e.environmentId ?? "workspace"),
    environmentName: String(e.environment_name ?? e.environmentName ?? "Workspace"),
    attackId: String(e.attack_id ?? e.attackId ?? ""),
    attackName: String(e.attack_name ?? e.attackName ?? "—"),
    defenseId: String(e.defense_id ?? e.defenseId ?? ""),
    defenseName: String(e.defense_name ?? e.defenseName ?? "—"),
    status: (e.status as Experiment["status"]) || "pending",
    runs: Number(e.runs ?? 0),
    completed: Number(e.completed ?? 0),
    asr: (e.asr as number | null) ?? null,
    utility: (e.utility as number | null) ?? null,
    seed: Number(e.seed ?? 0),
    createdAt: String(e.created_at ?? e.createdAt ?? ""),
    scenarioId: (e.scenario_id as string | null) ?? null,
    userTask: (e.user_task as string) || "",
    injectionGoal: (e.injection_goal as string) || "",
    failed: Number(e.failed ?? 0),
    error: (e.error as string | null) ?? null,
    modelId: (e.model_id as string | null) ?? null,
    traces: (e.traces as TraceSummary[]) || [],
  };
}

function mapAttack(a: Record<string, unknown>): Attack {
  return {
    id: String(a.id),
    name: String(a.name ?? ""),
    category: String(a.category ?? ""),
    level: Number(a.level ?? 0),
    risk: (a.risk as Attack["risk"]) || "medium",
    injectionPoint: String(a.injection_point ?? a.injectionPoint ?? ""),
    description: String(a.description ?? ""),
    objective: String(a.objective ?? ""),
    status: (a.status as Attack["status"]) || "offline",
    scenarioId: (a.scenario_id as string | null) ?? null,
  };
}

function mapDefense(d: Record<string, unknown>): Defense {
  return {
    id: String(d.id),
    name: String(d.name ?? ""),
    layer: (d.layer as Defense["layer"]) || "input",
    enabled: Boolean(d.enabled),
    description: String(d.description ?? ""),
    status: (d.status as Defense["status"]) || "offline",
  };
}

export function mapTraceSummary(t: Record<string, unknown>): TraceSummary {
  return {
    id: String(t.id),
    experiment_id: String(t.experiment_id ?? t.experimentId ?? ""),
    experiment_name: String(t.experiment_name ?? t.experimentName ?? ""),
    experimentId: String(t.experiment_id ?? t.experimentId ?? ""),
    experimentName: String(t.experiment_name ?? t.experimentName ?? ""),
    user_task: String(t.user_task ?? t.userTask ?? ""),
    injection_goal: String(t.injection_goal ?? t.injectionGoal ?? ""),
    outcome: (t.outcome as TraceSummary["outcome"]) || "safe",
    step_count: Number(t.step_count ?? 0),
    utility: (t.utility as boolean | null) ?? null,
    attack_success: (t.attack_success as boolean | null) ?? null,
    created_at: String(t.created_at ?? t.createdAt ?? ""),
  };
}

export async function fetchModels(): Promise<ModelRecord[]> {
  const data = await apiFetch<{ items: ModelRecord[] }>("/api/models");
  return data.items;
}

export async function fetchAgents(): Promise<Agent[]> {
  const data = await apiFetch<{ items: Agent[] }>("/api/agents");
  return data.items.map((a) => ({
    ...a,
    status: (a.status || a.model?.status || "offline") as Agent["status"],
    family: a.model?.family || a.family || "—",
    provider: a.model?.provider || a.provider || "local",
    params: a.model?.params || a.params || "—",
    version: a.model?.backend || a.version || "—",
  }));
}

export async function fetchEnvironments(): Promise<Environment[]> {
  const data = await apiFetch<{ items: Environment[] }>("/api/environments");
  return data.items;
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  const data = await apiFetch<{ items: ScenarioSummary[] }>("/api/scenarios");
  return data.items;
}

export async function fetchAttacks(): Promise<Attack[]> {
  const data = await apiFetch<{ items: Record<string, unknown>[] }>("/api/attacks");
  return data.items.map(mapAttack);
}

export async function fetchDefenses(): Promise<Defense[]> {
  const data = await apiFetch<{ items: Record<string, unknown>[] }>("/api/defenses");
  return data.items.map(mapDefense);
}

export async function fetchWorkspaceSnapshot(opts?: {
  scenario_id?: string;
  inject_malicious?: boolean;
}): Promise<WorkspaceSnapshot> {
  const params = new URLSearchParams();
  if (opts?.scenario_id) params.set("scenario_id", opts.scenario_id);
  if (opts?.inject_malicious) params.set("inject_malicious", "true");
  const q = params.toString() ? `?${params}` : "";
  return apiFetch<WorkspaceSnapshot>(`/api/environments/workspace/snapshot${q}`);
}

export async function runRuntime(body: {
  agent_id: string;
  user_task: string;
  max_steps?: number;
  seed?: number;
  inject_malicious?: boolean;
  scenario_id?: string;
  defense_id?: string;
}): Promise<RuntimeRunResponse> {
  const params = new URLSearchParams();
  if (body.inject_malicious) params.set("inject_malicious", "true");
  if (body.scenario_id) params.set("scenario_id", body.scenario_id);
  const q = params.toString() ? `?${params}` : "";
  return apiFetch<RuntimeRunResponse>(`/api/runtime/run${q}`, {
    method: "POST",
    body: JSON.stringify({
      agent_id: body.agent_id,
      user_task: body.user_task,
      max_steps: body.max_steps,
      seed: body.seed ?? 42,
      scenario_id: body.scenario_id,
      inject_malicious: body.inject_malicious,
      defense_id: body.defense_id,
    }),
  });
}

export async function fetchExperiments(): Promise<Experiment[]> {
  const data = await apiFetch<{ items: Record<string, unknown>[] }>(
    "/api/experiments"
  );
  return data.items.map(mapExperiment);
}

export async function fetchExperiment(id: string): Promise<Experiment> {
  const rec = await apiFetch<Record<string, unknown>>(`/api/experiments/${id}`);
  return mapExperiment(rec);
}

export async function createExperiment(body: {
  name: string;
  agent_id: string;
  environment_id: string;
  attack_id: string;
  defense_id: string;
  runs: number;
  seed: number;
  start?: boolean;
}): Promise<Experiment> {
  const rec = await apiFetch<Record<string, unknown>>("/api/experiments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapExperiment(rec);
}

export async function startExperiment(id: string): Promise<Experiment> {
  const rec = await apiFetch<Record<string, unknown>>(
    `/api/experiments/${id}/start`,
    { method: "POST" }
  );
  return mapExperiment(rec);
}

export async function startAblationSweep(body: {
  name?: string;
  agent_id: string;
  attack_id?: string;
  runs: number;
  seed: number;
  start?: boolean;
}): Promise<{
  sweep: string;
  experiments: Record<string, unknown>[];
  defense_ids: string[];
}> {
  return apiFetch("/api/experiments/ablation", {
    method: "POST",
    body: JSON.stringify({
      name: body.name ?? "Indirect PI Defense Ablation",
      agent_id: body.agent_id,
      attack_id: body.attack_id ?? "atk-indirect-pi",
      runs: body.runs,
      seed: body.seed,
      start: body.start ?? true,
    }),
  });
}

export async function fetchTraces(experimentId?: string): Promise<TraceSummary[]> {
  const q = experimentId
    ? `?experiment_id=${encodeURIComponent(experimentId)}`
    : "";
  const data = await apiFetch<{ items: Record<string, unknown>[] }>(
    `/api/traces${q}`
  );
  return data.items.map(mapTraceSummary);
}

export async function fetchTrace(id: string): Promise<TraceEpisode> {
  return apiFetch<TraceEpisode>(`/api/traces/${id}`);
}

export async function fetchReports(): Promise<{
  completed_experiments: number;
  mean_asr: number | null;
  mean_utility: number | null;
  matrix: Array<{
    id: string;
    name: string;
    agent: string;
    attack: string;
    defense: string;
    defense_id?: string;
    attack_id?: string;
    scenario_id?: string;
    runs: number;
    asr: number | null;
    utility: number | null;
    created_at: string;
  }>;
  ablation?: Array<{
    defense_id: string;
    defense: string;
    experiments: number;
    episodes: number;
    asr: number | null;
    utility: number | null;
  }>;
}> {
  return apiFetch("/api/reports");
}

export async function fetchDashboard(): Promise<{
  metrics: DashboardMetrics;
  recent: Experiment[];
}> {
  const d = await apiFetch<Record<string, unknown>>("/api/dashboard");
  return {
    metrics: {
      agents: Number(d.agents ?? 0),
      attacks: Number(d.attacks ?? 0),
      trials: Number(d.trials ?? 0),
      environments: Number(d.environments ?? 0),
      avgAsr: Number(d.avgAsr ?? 0),
      avgUtility: Number(d.avgUtility ?? 0),
      systemStatus: (d.systemStatus as DashboardMetrics["systemStatus"]) || "ready",
      trend: (d.trend as DashboardMetrics["trend"]) || [],
    },
    recent: ((d.recent as Record<string, unknown>[]) || []).map(mapExperiment),
  };
}

export async function fetchHealth(): Promise<{
  status: string;
  models_root: string;
  default_model_id: string;
  gpu_available?: boolean;
} | null> {
  try {
    return await apiFetch("/health");
  } catch {
    return null;
  }
}

export { API_BASE };
