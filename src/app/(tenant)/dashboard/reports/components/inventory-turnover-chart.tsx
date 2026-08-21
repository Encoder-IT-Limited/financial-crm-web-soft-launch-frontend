"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { inventoryTurnover } from "../mock-data";

const chartConfig = {
  rate: { label: "Turnover rate", color: "var(--color-blue)" },
} satisfies ChartConfig;

export function InventoryTurnoverChart() {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
          Inventory Turnover Rate
        </h2>
        <p className="mt-0.5 text-[11.5px] text-text-3 min-[1440px]:text-xs">
          Times stock sold through over the last 6 months
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[260px] w-full min-[1440px]:h-[280px]"
      >
        <LineChart data={inventoryTurnover} margin={{ left: -18, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(value: number) => `${value}×`}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--color-border)" }}
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={(value) => `${Number(value).toFixed(1)}×`}
              />
            }
          />
          <Line
            dataKey="rate"
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
