"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FlaskConical,
  Bot,
  Crosshair,
  ShieldCheck,
  Globe,
  GitBranch,
  FileBarChart,
  Settings,
  Cpu,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockMetrics } from "@/lib/mock-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/runtime", label: "Runtime", icon: Play },
  { href: "/attacks", label: "Attacks", icon: Crosshair },
  { href: "/defenses", label: "Defenses", icon: ShieldCheck },
  { href: "/environments", label: "Environments", icon: Globe },
  { href: "/traces", label: "Traces", icon: GitBranch },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = mockMetrics.systemStatus;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-[hsl(222_47%_7%)]">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Shield className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight">
              Agent Security Range
            </div>
            <div className="text-[11px] text-muted-foreground">
              Research Console
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur">
          <div className="text-sm text-muted-foreground">
            Lab · Model Runtime MVP · Mock Adapter
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                status === "ready" && "bg-success",
                status === "degraded" && "bg-warning",
                status === "offline" && "bg-destructive"
              )}
            />
            <span className="text-foreground">
              {status === "ready"
                ? "System Ready"
                : status === "degraded"
                  ? "System Degraded"
                  : "System Offline"}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
