"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchExperiment, startExperiment } from "@/lib/api";
import { formatPercent } from "@/lib/utils";
import type { Experiment } from "@/types";

export default function ExperimentDetailPage() {
  const params = useParams<{ id: string }>();
  const [exp, setExp] = useState<Experiment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    try {
      const rec = await fetchExperiment(params.id);
      setExp(rec);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (exp?.status !== "running") return;
    const t = setInterval(() => void load(), 1000);
    return () => clearInterval(t);
  }, [exp?.status, load]);

  async function onStart() {
    if (!exp) return;
    setStarting(true);
    try {
      const rec = await startExperiment(exp.id);
      setExp(rec);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  }

  if (error && !exp) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        {error}{" "}
        <Link href="/experiments" className="text-primary hover:underline">
          Back
        </Link>
      </div>
    );
  }

  if (!exp) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const progress =
    exp.runs > 0 ? Math.round((exp.completed / exp.runs) * 100) : 0;
  const traces = exp.traces || [];

  return (
    <div>
      <PageHeader
        title={exp.name}
        description={`${exp.id} · seed ${exp.seed}${exp.scenarioId ? ` · ${exp.scenarioId}` : ""}`}
        actions={
          <>
            <StatusBadge status={exp.status} />
            {exp.status === "pending" ? (
              <Button onClick={() => void onStart()} disabled={starting}>
                {starting ? "Starting…" : "Run"}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/experiments">Back</Link>
            </Button>
          </>
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="mt-2 text-2xl font-semibold">{progress}%</div>
            <Progress className="mt-3" value={progress} />
            <div className="mt-2 text-xs text-muted-foreground">
              {exp.completed} / {exp.runs} completed
              {exp.failed ? ` · ${exp.failed} failed` : ""}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">ASR</div>
            <div className="mt-2 text-2xl font-semibold text-destructive">
              {formatPercent(exp.asr)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Utility</div>
            <div className="mt-2 text-2xl font-semibold text-success">
              {formatPercent(exp.utility)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Failed</div>
            <div className="mt-2 text-2xl font-semibold">{exp.failed ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Agent" value={exp.agentName} />
            <Row label="Environment" value={exp.environmentName} />
            <Row label="Attack" value={exp.attackName} />
            <Row label="Defense" value={exp.defenseName} />
            <Row label="Runs" value={String(exp.runs)} />
            {exp.userTask ? <Row label="Task" value={exp.userTask} /> : null}
            {exp.injectionGoal ? (
              <Row label="Injection Goal" value={exp.injectionGoal} />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Linked Traces</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/traces">Trace Viewer</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {traces.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {exp.status === "running" ? "正在写入轨迹…" : "暂无关联轨迹。"}
              </p>
            ) : (
              traces.map((t) => (
                <Link
                  key={t.id}
                  href={`/traces/${t.id}`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/40"
                >
                  <span className="font-medium">{t.id}</span>
                  <Badge
                    variant={
                      t.outcome === "compromised"
                        ? "danger"
                        : t.outcome === "safe"
                          ? "success"
                          : "warning"
                    }
                  >
                    {t.outcome}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[70%] text-right font-medium">{value}</span>
    </div>
  );
}
