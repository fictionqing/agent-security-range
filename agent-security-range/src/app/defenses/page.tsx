"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDefenses } from "@/lib/api";
import type { Defense } from "@/types";

export default function DefensesPage() {
  const [items, setItems] = useState<Defense[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDefenses()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div>
      <PageHeader
        title="Defense Library"
        description="以 middleware 插入 Input / Tool / Memory / Output。可在实验中做 Baseline vs 单层 vs Combined ablation。"
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((def) => (
          <Card key={def.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{def.name}</CardTitle>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">{def.layer}</Badge>
                  <Badge variant={def.status === "ready" ? "success" : "muted"}>
                    {(def.status || "offline").toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{def.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
