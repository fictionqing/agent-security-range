"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTraces } from "@/lib/api";
import type { TraceSummary } from "@/types";

export default function TracesPage() {
  const [items, setItems] = useState<TraceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const data = await fetchTraces();
        if (!stop) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : String(e));
      }
    }
    void load();
    const t = setInterval(() => void load(), 2500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Trace Viewer"
        description="全链路 episode 轨迹：User → Agent → Observation → Tool → Environment → Security Event。"
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      {items.length === 0 && !error ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            还没有持久化轨迹。请先在 /runtime 试跑，或创建一次 Experiment。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((trace) => (
            <Card key={trace.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle>
                    <Link
                      href={`/traces/${trace.id}`}
                      className="hover:text-primary"
                    >
                      {trace.id}
                    </Link>
                  </CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {trace.experiment_name || trace.experimentName}
                  </div>
                </div>
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
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">User Task · </span>
                  {trace.user_task || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Injection Goal · </span>
                  {trace.injection_goal || "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {trace.step_count ?? 0} steps recorded
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
