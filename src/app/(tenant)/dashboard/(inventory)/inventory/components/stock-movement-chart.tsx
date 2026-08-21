"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { stockMovement } from "../mock-data";

const chartConfig = {
  in: { label: "In", color: "var(--color-green)" },
  out: { label: "Out", color: "var(--color-red)" },
} satisfies ChartConfig;

const seriesMeta = [
  { key: "in" as const, label: "In", color: "var(--color-green)" },
  { key: "out" as const, label: "Out", color: "var(--color-red)" },
];

function formatQty(value: number) {
  return value >= 1000 ? `${value / 1000}K` : `${value}`;
}

export function StockMovementChart() {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
        Stock Movement (This Week)
      </h2>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[260px] w-full min-[1440px]:h-[280px]"
      >
        <AreaChart data={stockMovement} margin={{ left: -18, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="fillIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-green)" stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--color-green)" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="fillOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-red)" stopOpacity={0.18} />
              <stop offset="95%" stopColor="var(--color-red)" stopOpacity={0.04} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 1000]}
            ticks={[0, 250, 500, 750, 1000]}
            tickFormatter={formatQty}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />

          <Area
            dataKey="in"
            type="monotone"
            stroke="var(--color-green)"
            strokeWidth={2}
            fill="url(#fillIn)"
            activeDot={{ r: 4 }}
          />
          <Area
            dataKey="out"
            type="monotone"
            stroke="var(--color-red)"
            strokeWidth={2}
            fill="url(#fillOut)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>

      <div className="flex items-center justify-center gap-5">
        {seriesMeta.map((s) => (
          <span
            key={s.key}
            className="flex items-center gap-1.5 text-[12px] font-medium text-text-2"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
