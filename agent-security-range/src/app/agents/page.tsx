"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAgents } from "@/lib/api";
import { mockAgents } from "@/lib/mock-data";
import type { Agent } from "@/types";

const statusVariant = {
  ready: "success" as const,
  busy: "warning" as const,
  offline: "muted" as const,
  downloading: "warning" as const,
  loading: "warning" as const,
  error: "danger" as const,
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [source, setSource] = useState<"api" | "mock">("mock");

  useEffect(() => {
    void fetchAgents()
      .then((items) => {
        setAgents(items);
        setSource("api");
      })
      .catch(() => {
        setAgents(mockAgents);
        setSource("mock");
      });
  }, []);

  return (
    <div>
      <PageHeader
        title="Agent Library"
        description="Agent = Model + Memory + Tools。模型通过 model_id 绑定，可替换 Mock / Qwen / Llama。"
        actions={
          <Button asChild variant="outline">
            <Link href="/runtime">Open Runtime</Link>
          </Button>
        }
      />

      <div className="mb-4">
        <Badge variant={source === "api" ? "success" : "warning"}>
          source · {source}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{agent.name}</CardTitle>
                <div className="mt-1 text-xs text-muted-foreground">
                  {(agent.family || agent.model?.family || "—") +
                    " · " +
                    (agent.provider || agent.model?.provider || "local")}
                </div>
              </div>
              <Badge variant={statusVariant[agent.status] || "muted"}>
                {String(agent.status).toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{agent.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {agent.model_id || agent.model?.id ? (
                  <Badge variant="outline">
                    model · {agent.model_id || agent.model?.id}
                  </Badge>
                ) : null}
                {agent.params || agent.model?.params ? (
                  <Badge variant="outline">
                    {agent.params || agent.model?.params}
                  </Badge>
                ) : null}
                <Badge variant="secondary">{agent.id}</Badge>
              </div>
              {agent.tools?.length ? (
                <div className="flex flex-wrap gap-1">
                  {agent.tools.map((t) => (
                    <Badge key={t} variant="muted" className="font-mono">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
