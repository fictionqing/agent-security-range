"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { fetchEnvironments, fetchWorkspaceSnapshot } from "@/lib/api";
import type { Environment, WorkspaceSnapshot } from "@/types";

const statusVariant = {
  ready: "success" as const,
  warming: "warning" as const,
  offline: "muted" as const,
};

export default function EnvironmentsPage() {
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState("workspace_baseline");
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [loadingSnap, setLoadingSnap] = useState(false);

  useEffect(() => {
    void fetchEnvironments()
      .then((items) => {
        setEnvs(items);
        const ws = items.find((e) => e.id === "workspace");
        const first = ws?.scenarios?.[0]?.id;
        if (first) setScenarioId(first);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const loadSnapshot = useCallback(async (sid: string) => {
    setLoadingSnap(true);
    setError(null);
    try {
      const snap = await fetchWorkspaceSnapshot({ scenario_id: sid });
      setSnapshot(snap);
    } catch (e) {
      setSnapshot(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingSnap(false);
    }
  }, []);

  useEffect(() => {
    if (scenarioId) void loadSnapshot(scenarioId);
  }, [scenarioId, loadSnapshot]);

  const workspace = envs.find((e) => e.id === "workspace");
  const scenarios = workspace?.scenarios || [];

  return (
    <div>
      <PageHeader
        title="Environment Library"
        description="可独立启动的实验场景：Workspace / Browser / Coding / Finance。每个 episode 可重置。"
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</p>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {envs.map((env) => (
          <Card key={env.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{env.name}</CardTitle>
                <div className="mt-1 text-xs text-muted-foreground">
                  type · {env.type}
                </div>
              </div>
              <Badge variant={statusVariant[env.status]}>
                {env.status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{env.description}</p>
              <div>
                <div className="mb-2 text-xs text-muted-foreground">
                  Registered Tools
                </div>
                <div className="flex flex-wrap gap-2">
                  {(env.tools.length ? env.tools : ["—"]).map((tool) => (
                    <Badge key={tool} variant="secondary" className="font-mono">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
              {env.scenarios && env.scenarios.length > 0 ? (
                <div>
                  <div className="mb-2 text-xs text-muted-foreground">
                    Scenarios
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {env.scenarios.map((s) => (
                      <li key={s.id}>
                        <span className="font-mono text-foreground">{s.id}</span>
                        {s.inject_malicious ? " · PI" : " · baseline"} — {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle>Workspace Snapshot</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="min-w-[240px]"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              disabled={loadingSnap}
              onClick={() => void loadSnapshot(scenarioId)}
            >
              {loadingSnap ? "Loading…" : "Reset / Reload"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!snapshot ? (
            <p className="text-sm text-muted-foreground">
              选择场景后加载种子邮箱 / 云盘状态。
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Inbox ({snapshot.state.counts?.emails ?? snapshot.state.emails.length})
                  {snapshot.state.inject_malicious ? (
                    <Badge variant="danger" className="ml-2">
                      PI injected
                    </Badge>
                  ) : null}
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {snapshot.state.emails.map((mail) => (
                    <div
                      key={String(mail.id)}
                      className="rounded-md border border-border px-3 py-2 text-xs"
                    >
                      <div className="font-mono text-foreground">
                        {String(mail.id)} · {String(mail.from)}
                      </div>
                      <div className="text-muted-foreground">
                        {String(mail.subject)}
                      </div>
                      <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
                        {String(mail.body || "").slice(0, 400)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    Drive ({snapshot.state.counts?.documents ?? snapshot.state.documents.length})
                  </div>
                  <ul className="space-y-1 text-xs">
                    {snapshot.state.documents.map((doc) => (
                      <li
                        key={String(doc.name)}
                        className="rounded border border-border px-2 py-1 font-mono"
                      >
                        {String(doc.name)}{" "}
                        <span className="text-muted-foreground">
                          · {String(doc.sensitivity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    Contacts / Calendar
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {snapshot.state.contacts.length} contacts ·{" "}
                    {snapshot.state.calendar.length} events
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
