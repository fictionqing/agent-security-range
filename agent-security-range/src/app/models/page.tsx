"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE, fetchHealth, fetchModels } from "@/lib/api";
import type { ModelRecord } from "@/types";

const statusVariant = {
  ready: "success" as const,
  offline: "muted" as const,
  downloading: "warning" as const,
  loading: "warning" as const,
  error: "danger" as const,
  busy: "warning" as const,
};

export default function ModelsPage() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<string>("checking…");

  async function load() {
    setError(null);
    const h = await fetchHealth();
    setHealth(
      h
        ? `API ok · root ${h.models_root}`
        : `API offline (${API_BASE || "/api"})`
    );
    try {
      const items = await fetchModels();
      setModels(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setModels([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Model Registry"
        description="统一管理 Mock / Qwen / Llama / DeepSeek。Agent 只绑定 model_id，不硬编码厂商实现。无 GPU 也可维护目录与 Mock。"
        actions={
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={health.startsWith("API ok") ? "success" : "warning"}>
          {health}
        </Badge>
        <span>默认推理走 OpenAI-compatible / Mock Adapter</span>
      </div>

      {error ? (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            无法加载 Registry：{error}
            <div className="mt-2 text-muted-foreground">
              请先启动后端：`cd /root/range/backend && ./run.sh`
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {models.map((m) => (
          <Card key={m.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{m.name}</CardTitle>
                <div className="mt-1 text-xs text-muted-foreground">
                  {m.family} · {m.backend} · {m.provider}
                </div>
              </div>
              <Badge variant={statusVariant[m.status] || "muted"}>
                {m.status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{m.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{m.params}</Badge>
                <Badge variant="secondary">{m.id}</Badge>
                <Badge variant={m.weights_present ? "success" : "muted"}>
                  weights {m.weights_present ? "present" : "missing"}
                </Badge>
              </div>
              <dl className="space-y-1 text-xs text-muted-foreground">
                {m.hf_id ? (
                  <div className="grid grid-cols-[72px_1fr] gap-2">
                    <dt>HF</dt>
                    <dd className="font-mono text-foreground">{m.hf_id}</dd>
                  </div>
                ) : null}
                {m.path ? (
                  <div className="grid grid-cols-[72px_1fr] gap-2">
                    <dt>Path</dt>
                    <dd className="break-all font-mono text-foreground">{m.path}</dd>
                  </div>
                ) : null}
                {m.base_url ? (
                  <div className="grid grid-cols-[72px_1fr] gap-2">
                    <dt>API</dt>
                    <dd className="font-mono text-foreground">{m.base_url}</dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
