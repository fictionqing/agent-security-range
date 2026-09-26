"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricPoint } from "@/types";

export function AsrUtilityChart({ data }: { data: MetricPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="asrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="utilFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(217 25% 18%)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(222 47% 9%)",
              border: "1px solid hsl(217 25% 18%)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              `${(value * 100).toFixed(1)}%`,
              name === "asr" ? "ASR" : "Utility",
            ]}
          />
          <Legend
            formatter={(value) => (value === "asr" ? "ASR" : "Utility")}
            wrapperStyle={{ fontSize: 12, color: "hsl(215 20% 65%)" }}
          />
          <Area
            type="monotone"
            dataKey="asr"
            stroke="hsl(199 89% 48%)"
            fill="url(#asrFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="utility"
            stroke="hsl(142 71% 45%)"
            fill="url(#utilFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
