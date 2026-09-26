"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Eye,
  GitBranch,
  ShieldAlert,
  Terminal,
  User,
} from "lucide-react";
import { PageHeader, RiskBadge } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTrace } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TraceEpisode, TraceStep, TraceStepType } from "@/types";

const typeMeta: Record<
  TraceStepType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  user: { label: "User", icon: User },
  agent: { label: "Agent", icon: Bot },
  observation: { label: "Observation", icon: Eye },
  tool: { label: "Tool", icon: Terminal },
  environment: { label: "Environment", icon: GitBranch },
  security: { label: "Security", icon: ShieldAlert },
};

export default function TraceDetailPage() {
  const params = useParams<{ id: string }>();
  const [trace, setTrace] = useState<TraceEpisode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!params.id) return;
    void fetchTrace(params.id)
      .then((t) => {
        setTrace(t);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [params.id]);

  if (error && !trace) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        {error}{" "}
        <Link href="/traces" className="text-primary hover:underline">
          Back to traces
        </Link>
      </div>
    );
  }

  if (!trace) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const steps = trace.steps || [];
  const activeId = selectedId ?? steps[0]?.id;
  const selected = steps.find((s) => s.id === activeId) ?? steps[0];

  return (
    <div>
      <PageHeader
        title={`Episode ${trace.id}`}
        description={trace.experimentName}
        actions={
          <>
            <Badge
              variant={
                trace.outcome === "compromised"
                  ? "danger"
                  : trace.outcome === "safe"
                    ? "success"
                    : "warning"
              }
            >
              {trace.outcome}
            </Badge>
            {trace.experimentId && trace.experimentId !== "adhoc" ? (
              <Button asChild variant="outline">
                <Link href={`/experiments/${trace.experimentId}`}>Experiment</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/traces">Back</Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="text-xs text-muted-foreground">User Task</div>
            <div className="mt-1">{trace.userTask}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="text-xs text-muted-foreground">Injection Goal</div>
            <div className="mt-1">{trace.injectionGoal}</div>
          </CardContent>
        </Card>
      </div>

      {steps.length === 0 || !selected ? (
        <p className="text-sm text-muted-foreground">No steps recorded.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Attack Chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, idx) => (
                <StepRow
                  key={step.id}
                  step={step}
                  isLast={idx === steps.length - 1}
                  active={step.id === selected.id}
                  onSelect={() => setSelectedId(step.id)}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Step Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Step {selected.step}</Badge>
                <Badge variant="secondary">
                  {(typeMeta[selected.type] || typeMeta.agent).label}
                </Badge>
                {selected.risk ? <RiskBadge risk={selected.risk} /> : null}
                {selected.violation ? (
                  <Badge variant="danger" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Violation
                  </Badge>
                ) : null}
              </div>
              <div>
                <div className="text-sm font-medium">{selected.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {selected.detail}
                </p>
              </div>
              {selected.toolName ? (
                <div className="rounded-md border border-border bg-secondary/30 p-3">
                  <div className="text-xs text-muted-foreground">Tool Call</div>
                  <div className="mt-1 font-mono text-sm text-primary">
                    {selected.toolName}
                  </div>
                  {selected.toolArgs ? (
                    <dl className="mt-3 space-y-2 text-xs">
                      {Object.entries(selected.toolArgs).map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[88px_1fr] gap-2">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="break-all font-mono text-foreground">
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StepRow({
  step,
  isLast,
  active,
  onSelect,
}: {
  step: TraceStep;
  isLast: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = typeMeta[step.type] || typeMeta.agent;
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full gap-3 rounded-md border px-3 py-3 text-left transition-colors",
        active
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-secondary/10 hover:bg-secondary/30",
        step.violation && "border-destructive/40"
      )}
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            step.violation
              ? "bg-destructive/15 text-destructive"
              : "bg-secondary text-primary"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast ? (
          <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 12 }} />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Step {String(step.step).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium">{step.title}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {step.detail}
        </p>
      </div>
    </button>
  );
}
