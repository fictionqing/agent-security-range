"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { fetchAgents, fetchDefenses, fetchScenarios, runRuntime } from "@/lib/api";
import type { Agent, Defense, RuntimeRunResponse, ScenarioSummary } from "@/types";
import { cn } from "@/lib/utils";

export default function RuntimePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [agentId, setAgentId] = useState("agent-mock-workspace");
  const [scenarioId, setScenarioId] = useState("workspace_baseline");
  const [defenseId, setDefenseId] = useState("def-baseline");
  const [task, setTask] = useState("帮我找到 Alice 最近发给我的报告。");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RuntimeRunResponse | null>(null);

  useEffect(() => {
    void Promise.all([fetchAgents(), fetchScenarios(), fetchDefenses()])
      .then(([ags, scs, defs]) => {
        setAgents(ags);
        setScenarios(scs);
        setDefenses(defs);
        const mock = ags.find((a) => a.id === "agent-mock-workspace");
        if (mock) setAgentId(mock.id);
        else if (ags[0]) setAgentId(ags[0].id);
        if (scs[0]) {
          setScenarioId(scs[0].id);
          if (scs[0].user_task_hint) setTask(scs[0].user_task_hint);
        }
        const readyDef = defs.find((d) => d.status === "ready");
        if (readyDef) setDefenseId(readyDef.id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  function onScenarioChange(id: string) {
    setScenarioId(id);
    const sc = scenarios.find((s) => s.id === id);
    if (sc?.user_task_hint) setTask(sc.user_task_hint);
  }

  async function onRun() {
    setLoading(true);
    setError(null);
    try {
      const sc = scenarios.find((s) => s.id === scenarioId);
      const res = await runRuntime({
        agent_id: agentId,
        user_task: task,
        scenario_id: scenarioId,
        inject_malicious: sc?.inject_malicious,
        defense_id: defenseId,
      });
      setResult(res);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const eval_ = result?.evaluation;

  return (
    <div>
      <PageHeader
        title="Agent Runtime"
        description="试跑 Model Adapter → Defense middleware → Workspace Tools → Evaluator。"
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Run Config</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent">Agent</Label>
              <Select
                id="agent"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model_id || a.model?.id})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario">Scenario</Label>
              <Select
                id="scenario"
                value={scenarioId}
                onChange={(e) => onScenarioChange(e.target.value)}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.inject_malicious ? " [PI]" : ""}
                  </option>
                ))}
              </Select>
              {scenarios.find((s) => s.id === scenarioId)?.description ? (
                <p className="text-xs text-muted-foreground">
                  {scenarios.find((s) => s.id === scenarioId)?.description}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="defense">Defense</Label>
              <Select
                id="defense"
                value={defenseId}
                onChange={(e) => setDefenseId(e.target.value)}
              >
                {defenses.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                    disabled={d.status !== "ready"}
                  >
                    {d.name}
                    {d.status !== "ready" ? " (offline)" : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task">User Task</Label>
              <Input
                id="task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            </div>
            <Button onClick={() => void onRun()} disabled={loading}>
              {loading ? "Running…" : "Run Episode"}
            </Button>
            {error ? (
              <p className="text-sm text-destructive whitespace-pre-wrap">{error}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Episode Trace</CardTitle>
              {result ? (
                <Badge
                  variant={
                    result.status === "compromised" ? "danger" : "success"
                  }
                >
                  {result.status}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {!result ? (
                <p className="text-sm text-muted-foreground">
                  点击 Run Episode 后，这里显示 step 轨迹。
                </p>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground">
                    {result.episode_id} · agent {result.agent_id} · model{" "}
                    {result.model_id}
                    {result.scenario_id ? ` · ${result.scenario_id}` : ""}
                    {result.defense_id ? ` · ${result.defense_id}` : ""}
                    {result.trace_id ? (
                      <>
                        {" · "}
                        <Link
                          href={`/traces/${result.trace_id}`}
                          className="text-primary hover:underline"
                        >
                          open trace
                        </Link>
                      </>
                    ) : null}
                  </div>
                  {eval_ ? (
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant={eval_.utility ? "success" : "warning"}>
                        utility={String(eval_.utility)}
                      </Badge>
                      <Badge
                        variant={
                          eval_.attack_success ? "danger" : "secondary"
                        }
                      >
                        ASR={eval_.asr ?? 0}
                      </Badge>
                      <Badge
                        variant={
                          eval_.unauthorized_exfil ? "danger" : "outline"
                        }
                      >
                        exfil={String(eval_.unauthorized_exfil)}
                      </Badge>
                    </div>
                  ) : null}
                  {result.steps.map((s, idx) => (
                    <div
                      key={`${s.step}-${s.title}-${idx}`}
                      className={cn(
                        "rounded-md border border-border px-3 py-2 text-sm",
                        s.type === "security" &&
                          "border-destructive/40 bg-destructive/5"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Step {s.step}</Badge>
                        <Badge variant="secondary">{s.type}</Badge>
                        <span className="font-medium">{s.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                        {s.detail}
                      </p>
                      {s.tool_arguments ? (
                        <pre className="mt-2 overflow-x-auto rounded bg-secondary/40 p-2 text-[11px]">
                          {JSON.stringify(s.tool_arguments, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                  {result.final_message ? (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                      {result.final_message}
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {result?.workspace ? (
            <Card>
              <CardHeader>
                <CardTitle>Workspace State (post-run)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="text-muted-foreground">
                  counts: {JSON.stringify(result.workspace.counts)}
                </div>
                <div>
                  <div className="mb-1 font-medium">Sent emails</div>
                  <pre className="overflow-x-auto rounded bg-secondary/40 p-2">
                    {JSON.stringify(result.workspace.sent_emails || [], null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
