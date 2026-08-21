"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { warehouseStock } from "../mock-data";

const chartConfig = {
  value: { label: "Stock Value" },
  ...Object.fromEntries(
    warehouseStock.map((slice) => [
      slice.warehouse,
      { label: slice.warehouse, color: slice.fill },
    ])
  ),
} satisfies ChartConfig;

function formatAed(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export function WarehouseStockChart() {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
        Stock Value by Warehouse
      </h2>

      <div className="flex flex-col items-center gap-6 lg:flex-row">
        <div className="relative w-full max-w-[260px] shrink-0">
          <ChartContainer
            config={chartConfig}
            className="aspect-square h-[220px] w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent hideLabel indicator="dot" />
                }
              />
              <Pie
                data={warehouseStock}
                dataKey="value"
                nameKey="warehouse"
                innerRadius="64%"
                outerRadius="96%"
                paddingAngle={2}
                strokeWidth={2}
                stroke="var(--color-surface)"
              />
            </PieChart>
          </ChartContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-extrabold tracking-tight text-text">
              AED 2.58M
            </span>
            <span className="text-[11px] font-medium text-text-3">Total</span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-col gap-2.5 lg:flex-1">
          {warehouseStock.map((slice) => (
            <li key={slice.warehouse} className="flex items-center gap-2.5 text-[12.5px] min-[1440px]:text-[13px]">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.fill }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-text-2">
                {slice.warehouse}
              </span>
              <span className="font-semibold tabular-nums text-text">
                {formatAed(slice.value)}
              </span>
              <span className="w-12 shrink-0 text-right tabular-nums text-text-3">
                {slice.percentage}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
