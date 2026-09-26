import { Badge } from "@/components/ui/badge";
import type { ExperimentStatus, RiskLevel } from "@/types";

export function StatusBadge({ status }: { status: ExperimentStatus }) {
  const map = {
    pending: { label: "PENDING", variant: "muted" as const },
    running: { label: "RUNNING", variant: "warning" as const },
    done: { label: "DONE", variant: "success" as const },
    failed: { label: "FAILED", variant: "danger" as const },
  };
  const item = map[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const map = {
    low: { label: "LOW", variant: "success" as const },
    medium: { label: "MEDIUM", variant: "warning" as const },
    high: { label: "HIGH", variant: "danger" as const },
    critical: { label: "CRITICAL", variant: "danger" as const },
  };
  const item = map[risk];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
