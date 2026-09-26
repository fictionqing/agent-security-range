"use client";

import { useEffect, useState } from "react";
import { PageHeader, RiskBadge } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAttacks } from "@/lib/api";
import type { Attack } from "@/types";

export default function AttacksPage() {
  const [items, setItems] = useState<Attack[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAttacks()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div>
      <PageHeader
        title="Attack Library"
        description="攻击插件市场：每个 Attack 绑定场景。ready 项可被 Experiment Manager 调度。"
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((atk) => (
          <Card key={atk.id}>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle>{atk.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={atk.status === "ready" ? "success" : "muted"}>
                    {(atk.status || "offline").toUpperCase()}
                  </Badge>
                  <RiskBadge risk={atk.risk} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{atk.category}</Badge>
                <Badge variant="outline">Level {atk.level}</Badge>
                <Badge variant="outline">{atk.injectionPoint}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{atk.description}</p>
              <div className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Objective · </span>
                <span className="font-mono text-foreground">{atk.objective}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
