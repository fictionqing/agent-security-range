import agents from "@/mock/agents.json";
import attacks from "@/mock/attacks.json";
import defenses from "@/mock/defenses.json";
import environments from "@/mock/environments.json";
import experiments from "@/mock/experiments.json";
import metrics from "@/mock/metrics.json";
import traces from "@/mock/traces.json";
import type {
  Agent,
  Attack,
  Defense,
  Environment,
  Experiment,
  DashboardMetrics,
  TraceEpisode,
} from "@/types";

export const mockAgents = agents as Agent[];
export const mockAttacks = attacks as Attack[];
export const mockDefenses = defenses as Defense[];
export const mockEnvironments = environments as Environment[];
export const mockExperiments = experiments as Experiment[];
export const mockMetrics = metrics as DashboardMetrics;
export const mockTraces = traces as TraceEpisode[];

export function getExperiment(id: string) {
  return mockExperiments.find((e) => e.id === id);
}

export function getTrace(id: string) {
  return mockTraces.find((t) => t.id === id);
}

export function getTracesByExperiment(experimentId: string) {
  return mockTraces.filter((t) => t.experimentId === experimentId);
}
