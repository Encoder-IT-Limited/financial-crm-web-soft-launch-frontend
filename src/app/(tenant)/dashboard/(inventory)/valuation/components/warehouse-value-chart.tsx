"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import {
  WAREHOUSE_VALUE_COLORS,
  formatAxisAed,
  type ValuationRow,
} from "../mock-data";

interface WarehouseValueChartProps {
  rows: ValuationRow[];
}

export function WarehouseValueChart({ rows }: WarehouseValueChartProps) {
  const data = useMemo(() => {
    const byWarehouse = new Map<string, number>();
    for (const row of rows) {
      byWarehouse.set(
        row.warehouse,
        (byWarehouse.get(row.warehouse) ?? 0) + row.qty * row.unitRetail
      );
    }
    return [...byWarehouse.entries()]
      .map(([warehouse, value]) => ({
        warehouse,
        name: warehouse.replace(/ Warehouse$/, ""),
        value,
        fill: WAREHOUSE_VALUE_COLORS[warehouse] ?? "var(--color-blue)",
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const chartConfig = {
    value: { label: "Inventory value" },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
          Inventory Value by Warehouse
        </h2>
        <p className="mt-0.5 text-[11.5px] text-text-3 min-[1440px]:text-xs">
          Total stock value per location
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-14 text-center">
          <p className="text-sm font-semibold text-text">No stock to value</p>
          <p className="max-w-xs text-[12.5px] text-text-3">
            Nothing matches the current search or filters.
          </p>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full min-[1440px]:h-[280px]"
        >
          <BarChart data={data} margin={{ left: -14, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={8}
            />
            <YAxis
              tickFormatter={formatAxisAed}
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
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell key={entry.warehouse} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
}
