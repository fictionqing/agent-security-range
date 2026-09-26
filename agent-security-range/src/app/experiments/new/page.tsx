"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createExperiment,
  fetchAgents,
  fetchAttacks,
  fetchDefenses,
  fetchEnvironments,
  startAblationSweep,
} from "@/lib/api";
import type { Agent, Attack, Defense, Environment } from "@/types";

export default function NewExperimentPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("Mock × Indirect PI Sweep");
  const [agentId, setAgentId] = useState("agent-mock-workspace");
  const [environmentId, setEnvironmentId] = useState("workspace");
  const [attackId, setAttackId] = useState("atk-indirect-pi");
  const [defenseId, setDefenseId] = useState("def-baseline");
  const [runs, setRuns] = useState(5);
  const [seed, setSeed] = useState(42);

  useEffect(() => {
    void Promise.all([
      fetchAgents(),
      fetchEnvironments(),
      fetchAttacks(),
      fetchDefenses(),
    ])
      .then(([ags, environments, atks, defs]) => {
        setAgents(ags);
        setEnvs(environments);
        setAttacks(atks);
        setDefenses(defs);
        const mock = ags.find((a) => a.id === "agent-mock-workspace");
        if (mock) setAgentId(mock.id);
        else if (ags[0]) setAgentId(ags[0].id);
        const readyEnv = environments.find((e) => e.status === "ready");
        if (readyEnv) setEnvironmentId(readyEnv.id);
        const readyAtk = atks.find((a) => a.status === "ready" && a.id === "atk-indirect-pi");
        if (readyAtk) setAttackId(readyAtk.id);
        const readyDef = defs.find((d) => d.status === "ready");
        if (readyDef) setDefenseId(readyDef.id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const rec = await createExperiment({
        name,
        agent_id: agentId,
        environment_id: environmentId,
        attack_id: attackId,
        defense_id: defenseId,
        runs,
        seed,
        start: true,
      });
      router.push(`/experiments/${rec.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  async function onAblation() {
    setSubmitting(true);
    setError(null);
    try {
      await startAblationSweep({
        name: name || "Indirect PI Defense Ablation",
        agent_id: agentId,
        attack_id: "atk-indirect-pi",
        runs,
        seed,
        start: true,
      });
      router.push("/experiments");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Start Experiment"
        description="选择实验矩阵，或一键跑 Indirect PI × 各 Defense 的 ablation 对照。"
        actions={
          <Button asChild variant="outline">
            <Link href="/experiments">Back</Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Experiment Config</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agent">Agent</Label>
                  <Select
                    id="agent"
                    value={agentId}
                    onChange={(ev) => setAgentId(ev.target.value)}
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.model_id || a.model?.id})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    id="environment"
                    value={environmentId}
                    onChange={(ev) => setEnvironmentId(ev.target.value)}
                  >
                    {envs.map((env) => (
                      <option
                        key={env.id}
                        value={env.id}
                        disabled={env.status !== "ready"}
                      >
                        {env.name}
                        {env.status !== "ready" ? " (offline)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attack">Attack</Label>
                  <Select
                    id="attack"
                    value={attackId}
                    onChange={(ev) => setAttackId(ev.target.value)}
                  >
                    {attacks.map((atk) => (
                      <option
                        key={atk.id}
                        value={atk.id}
                        disabled={atk.status !== "ready"}
                      >
                        {atk.name}
                        {atk.status !== "ready" ? " (offline)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defense">Defense</Label>
                  <Select
                    id="defense"
                    value={defenseId}
                    onChange={(ev) => setDefenseId(ev.target.value)}
                  >
                    {defenses.map((def) => (
                      <option
                        key={def.id}
                        value={def.id}
                        disabled={def.status !== "ready"}
                      >
                        {def.name}
                        {def.status !== "ready" ? " (offline)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="runs">Runs</Label>
                  <Input
                    id="runs"
                    type="number"
                    min={1}
                    max={100}
                    value={runs}
                    onChange={(ev) => setRuns(Number(ev.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed">Seed</Label>
                  <Input
                    id="seed"
                    type="number"
                    value={seed}
                    onChange={(ev) => setSeed(Number(ev.target.value))}
                  />
                </div>
              </div>

              {error ? (
                <p className="text-sm text-destructive whitespace-pre-wrap">{error}</p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/experiments">Cancel</Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => void onAblation()}
                >
                  {submitting ? "Starting…" : "Run PI Ablation Sweep"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Starting…" : "Start Experiment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
