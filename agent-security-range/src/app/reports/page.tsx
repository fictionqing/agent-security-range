"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchReports } from "@/lib/api";
import { formatPercent } from "@/lib/utils";

type ReportsPayload = Awaited<ReturnType<typeof fetchReports>>;

export default function ReportsPage() {
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchReports()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const done = data?.matrix ?? [];
  const ablation = data?.ablation ?? [];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="实验汇总：按 Agent × Attack × Defense 聚合 ASR / Utility；下方为 Indirect PI 的 defense ablation。"
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Completed Experiments</div>
            <div className="mt-2 text-3xl font-semibold">
              {data?.completed_experiments ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Mean ASR</div>
            <div className="mt-2 text-3xl font-semibold text-destructive">
              {formatPercent(data?.mean_asr)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Mean Utility</div>
            <div className="mt-2 text-3xl font-semibold text-success">
              {formatPercent(data?.mean_utility)}
            </div>
          </CardContent>
        </Card>
      </div>

      {ablation.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Defense Ablation (Indirect PI)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Defense</th>
                  <th className="pb-3 font-medium">Experiments</th>
                  <th className="pb-3 font-medium">Episodes</th>
                  <th className="pb-3 font-medium">ASR</th>
                  <th className="pb-3 font-medium">Utility</th>
                </tr>
              </thead>
              <tbody>
                {ablation.map((row) => (
                  <tr key={row.defense_id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">{row.defense}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {row.experiments}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {row.episodes}
                    </td>
                    <td className="py-3 pr-4 text-destructive">
                      {formatPercent(row.asr)}
                    </td>
                    <td className="py-3 text-success">
                      {formatPercent(row.utility)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Result Matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {done.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无完成的实验。请先在 /experiments/new 跑一轮 Mock。
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Experiment</th>
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium">Attack</th>
                  <th className="pb-3 font-medium">Defense</th>
                  <th className="pb-3 font-medium">Runs</th>
                  <th className="pb-3 font-medium">ASR</th>
                  <th className="pb-3 font-medium">Utility</th>
                </tr>
              </thead>
              <tbody>
                {done.map((exp) => (
                  <tr key={exp.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">
                      <Link
                        href={`/experiments/${exp.id}`}
                        className="hover:text-primary"
                      >
                        {exp.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {exp.agent}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {exp.attack}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {exp.defense}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{exp.runs}</td>
                    <td className="py-3 pr-4 text-destructive">
                      {formatPercent(exp.asr)}
                    </td>
                    <td className="py-3 text-success">
                      {formatPercent(exp.utility)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
