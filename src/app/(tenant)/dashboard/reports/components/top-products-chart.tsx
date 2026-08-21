"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { formatAxisAed, topProductsByValue } from "../mock-data";

const chartConfig = {
  value: { label: "Stock value", color: "var(--color-blue)" },
} satisfies ChartConfig;

export function TopProductsChart() {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
          Top 5 Products by Value
        </h2>
        <p className="mt-0.5 text-[11.5px] text-text-3 min-[1440px]:text-xs">
          Most valuable items currently in stock
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[260px] w-full min-[1440px]:h-[280px]"
      >
        <BarChart
          data={topProductsByValue}
          layout="vertical"
          margin={{ left: 8, right: 16, top: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--color-border)" />
          <XAxis
            type="number"
            tickFormatter={formatAxisAed}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-surface-subtle)" }}
            content={
              <ChartTooltipContent
                hideLabel
                indicator="dot"
                formatter={(value) => fmtMoney(Number(value))}
              />
            }
          />
          <Bar
            dataKey="value"
            fill="var(--color-blue)"
            radius={[0, 6, 6, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
