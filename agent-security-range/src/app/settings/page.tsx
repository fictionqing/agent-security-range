"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE, fetchHealth } from "@/lib/api";

export default function SettingsPage() {
  const [health, setHealth] = useState<string>("checking…");
  const [modelsRoot, setModelsRoot] = useState<string>("—");

  useEffect(() => {
    void fetchHealth().then((h) => {
      if (!h) {
        setHealth("offline");
        return;
      }
      setHealth(h.status);
      setModelsRoot(h.models_root);
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="后端与推理端点配置。无 GPU 阶段使用 Mock Adapter；有卡后切 vLLM OpenAI-compatible API。"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>API Backend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Status: {health}</div>
            <div>Endpoint: {API_BASE || "/api (same origin → 127.0.0.1:8801)"}</div>
            <div>Models root: {modelsRoot}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Default adapter: MockModel</div>
            <div>vLLM base URL: http://127.0.0.1:8001/v1</div>
            <div>GPU: not required for current MVP</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
