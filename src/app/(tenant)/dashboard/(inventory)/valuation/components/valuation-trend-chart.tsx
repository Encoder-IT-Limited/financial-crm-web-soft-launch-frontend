"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { formatAxisAed, valuationTrend } from "../mock-data";

const chartConfig = {
  value: { label: "Inventory value", color: "var(--color-blue)" },
} satisfies ChartConfig;

export function ValuationTrendChart() {
  return (
    <Card className="flex flex-col gap-4 lg:col-span-2">
      <div>
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
          Valuation Trend
        </h2>
        <p className="mt-0.5 text-[11.5px] text-text-3 min-[1440px]:text-xs">
          Total inventory value over the last 6 months
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[260px] w-full min-[1440px]:h-[280px]"
      >
        <LineChart data={valuationTrend} margin={{ left: -14, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis
            tickFormatter={formatAxisAed}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--color-border)" }}
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={(value) => fmtMoney(Number(value))}
              />
            }
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-blue)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-blue)", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
}
