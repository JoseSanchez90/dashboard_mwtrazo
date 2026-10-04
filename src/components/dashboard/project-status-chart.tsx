"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/types/project";

export function ProjectStatusChart({
  data,
}: {
  data: Array<{ status: ProjectStatus; count: number }>;
}) {
  if (data.length === 0)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No hay proyectos para representar.
      </p>
    );
  const chartData = data.map((item) => ({
    name: PROJECT_STATUS_LABELS[item.status],
    total: item.count,
  }));
  return (
    <div
      className="h-56 w-full"
      aria-label="Distribución de proyectos por estado"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              borderRadius: 10,
              borderColor: "var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
            }}
            formatter={(value) => [String(value), "Proyectos"]}
          />
          <Bar
            dataKey="total"
            fill="var(--brand)"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
