export type ModelStatus =
  | "ready"
  | "offline"
  | "downloading"
  | "loading"
  | "error"
  | "busy";

export type ExperimentStatus = "pending" | "running" | "done" | "failed";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ModelRecord {
  id: string;
  name: string;
  family: string;
  provider: string;
  backend: "mock" | "vllm" | "openai" | "transformers";
  hf_id: string | null;
  path: string | null;
  status: ModelStatus;
  params: string;
  description: string;
  openai_model: string | null;
  weights_present: boolean;
  base_url: string | null;
}

export interface Agent {
  id: string;
  name: string;
  family?: string;
  provider?: string;
  version?: string;
  params?: string;
  status: "ready" | "offline" | "busy" | ModelStatus;
  description: string;
  model_id?: string;
  memory_enabled?: boolean;
  tools?: string[];
  model?: ModelRecord | null;
}

export interface Attack {
  id: string;
  name: string;
  category: string;
  level: number;
  risk: RiskLevel;
  injectionPoint: string;
  description: string;
  objective: string;
  status?: "ready" | "offline";
  scenarioId?: string | null;
}

export interface Defense {
  id: string;
  name: string;
  layer: "input" | "planner" | "tool" | "output" | "memory";
  enabled: boolean;
  description: string;
  status?: "ready" | "offline";
}

export interface ScenarioSummary {
  id: string;
  name: string;
  environment: string;
  inject_malicious: boolean;
  injection_point?: string | null;
  description: string;
  user_task_hint: string;
}

export interface ToolSpec {
  name: string;
  description: string;
}

export interface Environment {
  id: string;
  name: string;
  type: "workspace" | "browser" | "coding" | "finance";
  tools: string[];
  description: string;
  status: "ready" | "warming" | "offline";
  tool_specs?: ToolSpec[];
  scenarios?: ScenarioSummary[];
}

export interface WorkspaceSnapshot {
  environment: string;
  scenario_id: string | null;
  tools: ToolSpec[];
  state: {
    scenario_id?: string | null;
    inject_malicious?: boolean;
    emails: Array<Record<string, unknown>>;
    documents: Array<Record<string, unknown>>;
    contacts: Array<Record<string, unknown>>;
    calendar: Array<Record<string, unknown>>;
    sent_emails: Array<Record<string, unknown>>;
    counts?: Record<string, number>;
  };
}

export interface Experiment {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  environmentId: string;
  environmentName: string;
  attackId: string;
  attackName: string;
  defenseId: string;
  defenseName: string;
  status: ExperimentStatus;
  runs: number;
  completed: number;
  asr: number | null;
  utility: number | null;
  seed: number;
  createdAt: string;
  scenarioId?: string | null;
  userTask?: string;
  injectionGoal?: string;
  failed?: number;
  error?: string | null;
  modelId?: string | null;
  traces?: TraceSummary[];
}

export interface TraceSummary {
  id: string;
  experiment_id?: string;
  experiment_name?: string;
  experimentId?: string;
  experimentName?: string;
  user_task?: string;
  injection_goal?: string;
  outcome: "safe" | "compromised" | "utility_fail";
  step_count?: number;
  utility?: boolean | null;
  attack_success?: boolean | null;
  created_at?: string;
}

export interface MetricPoint {
  date: string;
  asr: number;
  utility: number;
}

export interface DashboardMetrics {
  agents: number;
  attacks: number;
  trials: number;
  environments: number;
  avgAsr: number;
  avgUtility: number;
  systemStatus: "ready" | "degraded" | "offline";
  trend: MetricPoint[];
}

export type TraceStepType =
  | "user"
  | "agent"
  | "observation"
  | "tool"
  | "environment"
  | "security";

export interface TraceStep {
  id: string;
  step: number;
  type: TraceStepType;
  title: string;
  detail: string;
  toolName?: string;
  toolArgs?: Record<string, string>;
  risk?: RiskLevel;
  violation?: boolean;
}

export interface TraceEpisode {
  id: string;
  experimentId: string;
  experimentName: string;
  userTask: string;
  injectionGoal: string;
  outcome: "safe" | "compromised" | "utility_fail";
  steps: TraceStep[];
  evaluation?: RuntimeEvaluation;
  agentId?: string;
  modelId?: string;
  createdAt?: string;
}

export interface RuntimeStep {
  step: number;
  type: string;
  title: string;
  detail: string;
  tool_name?: string | null;
  tool_arguments?: Record<string, unknown> | null;
  observation?: string | null;
}

export interface RuntimeEvaluation {
  utility?: boolean;
  attack_success?: boolean;
  unauthorized_exfil?: boolean;
  asr?: number;
  details?: Record<string, unknown>;
}

export interface RuntimeRunResponse {
  episode_id: string;
  agent_id: string;
  model_id: string;
  status: string;
  steps: RuntimeStep[];
  final_message: string | null;
  evaluation?: RuntimeEvaluation | null;
  scenario_id?: string | null;
  workspace?: {
    counts?: Record<string, number>;
    sent_emails?: Array<Record<string, unknown>>;
    emails?: Array<Record<string, unknown>>;
    documents?: Array<Record<string, unknown>>;
    inject_malicious?: boolean;
  } | null;
  trace_id?: string | null;
  defense_id?: string | null;
}
