"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchExperiments } from "@/lib/api";
import { formatDate, formatPercent } from "@/lib/utils";
import type { Experiment } from "@/types";

export default function ExperimentsPage() {
  const [items, setItems] = useState<Experiment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const data = await fetchExperiments();
        if (!stop) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : String(e));
      }
    }
    void load();
    const t = setInterval(() => void load(), 2000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Experiments"
        description="配置 Agent × Environment × Attack × Defense，批量跑 episode，结果写入 Trace / Reports。"
        actions={
          <Button asChild>
            <Link href="/experiments/new">Start Experiment</Link>
          </Button>
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      {items.length === 0 && !error ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            还没有实验。点击 Start Experiment，用 Mock Agent 先跑 3–5 次 episode。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((exp) => {
            const progress =
              exp.runs > 0 ? Math.round((exp.completed / exp.runs) * 100) : 0;
            return (
              <Card key={exp.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/experiments/${exp.id}`}
                          className="text-base font-semibold hover:text-primary"
                        >
                          {exp.name}
                        </Link>
                        <StatusBadge status={exp.status} />
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{exp.agentName}</Badge>
                        <Badge variant="outline">{exp.environmentName}</Badge>
                        <Badge variant="outline">{exp.attackName}</Badge>
                        <Badge variant="secondary">{exp.defenseName}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {exp.id} · seed {exp.seed} · {formatDate(exp.createdAt)}
                      </div>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-4 lg:w-auto lg:min-w-[420px]">
                      <div>
                        <div className="text-xs text-muted-foreground">Progress</div>
                        <div className="mt-1 text-sm font-medium">
                          {exp.completed}/{exp.runs}
                        </div>
                        <Progress className="mt-2" value={progress} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">ASR</div>
                        <div className="mt-1 text-sm font-medium text-destructive">
                          {formatPercent(exp.asr)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Utility</div>
                        <div className="mt-1 text-sm font-medium text-success">
                          {formatPercent(exp.utility)}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/experiments/${exp.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
