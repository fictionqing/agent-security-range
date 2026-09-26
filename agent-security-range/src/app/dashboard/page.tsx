"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Crosshair, FlaskConical, Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/layout/page-header";
import { AsrUtilityChart } from "@/components/dashboard/asr-utility-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchDashboard } from "@/lib/api";
import { formatPercent, formatDate } from "@/lib/utils";
import type { DashboardMetrics, Experiment } from "@/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recent, setRecent] = useState<Experiment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDashboard()
      .then((d) => {
        setMetrics(d.metrics);
        setRecent(d.recent);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const stats = [
    {
      label: "Agents",
      value: metrics?.agents ?? "—",
      icon: Bot,
      hint: "已注册被测模型",
    },
    {
      label: "Attacks",
      value: metrics?.attacks ?? "—",
      icon: Crosshair,
      hint: "可调度攻击（ready）",
    },
    {
      label: "Trials",
      value: metrics?.trials ?? "—",
      icon: FlaskConical,
      hint: "累计 episode",
    },
    {
      label: "Environments",
      value: metrics?.environments ?? "—",
      icon: Globe,
      hint: "可重置实验场景",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Security Overview"
        description="实验室智能体攻防实验总览。指标来自 Experiment Manager 持久化结果。"
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.hint}
                  </div>
                </div>
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attack Success Rate / Utility</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.trend?.length ? (
              <AsrUtilityChart data={metrics.trend} />
            ) : (
              <p className="text-sm text-muted-foreground">
                完成实验后这里会显示 ASR / Utility 趋势。
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg ASR</span>
                <span className="font-medium text-destructive">
                  {formatPercent(metrics?.avgAsr)}
                </span>
              </div>
              <Progress value={(metrics?.avgAsr ?? 0) * 100} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Utility</span>
                <span className="font-medium text-success">
                  {formatPercent(metrics?.avgUtility)}
                </span>
              </div>
              <Progress value={(metrics?.avgUtility ?? 0) * 100} />
            </div>
            <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
              Utility 衡量正常任务完成率；ASR 衡量攻击成功率。两者分离评估是
              AgentDojo 风格实验的核心设计。
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Experiments</CardTitle>
          <Link
            href="/experiments"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无实验记录。</p>
          ) : (
            recent.slice(0, 5).map((exp) => {
              const progress =
                exp.runs > 0 ? Math.round((exp.completed / exp.runs) * 100) : 0;
              return (
                <Link
                  key={exp.id}
                  href={`/experiments/${exp.id}`}
                  className="flex flex-col gap-2 rounded-md border border-border bg-secondary/20 px-4 py-3 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{exp.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{exp.id}</span>
                      <span>·</span>
                      <span>{exp.createdAt ? formatDate(exp.createdAt) : "—"}</span>
                      <Badge variant="outline">{exp.environmentName}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:shrink-0">
                    <div className="hidden w-28 sm:block">
                      <Progress value={progress} />
                    </div>
                    <div className="w-16 text-right text-xs text-muted-foreground">
                      ASR {formatPercent(exp.asr)}
                    </div>
                    <StatusBadge status={exp.status} />
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
