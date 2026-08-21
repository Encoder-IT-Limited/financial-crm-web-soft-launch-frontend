"use client";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import {
  CATEGORY_VALUE_COLORS,
  formatCompactAed,
  type ValuationRow,
} from "../mock-data";

interface CategoryValueChartProps {
  rows: ValuationRow[];
}

export function CategoryValueChart({ rows }: CategoryValueChartProps) {
  const slices = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const row of rows) {
      byCategory.set(
        row.category,
        (byCategory.get(row.category) ?? 0) + row.qty * row.unitRetail
      );
    }
    return [...byCategory.entries()]
      .map(([category, value]) => ({
        category,
        value,
        fill: CATEGORY_VALUE_COLORS[category as keyof typeof CATEGORY_VALUE_COLORS] ??
          "var(--color-blue)",
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const chartConfig = {
    value: { label: "Inventory value" },
    ...Object.fromEntries(
      slices.map((slice) => [slice.category, { label: slice.category, color: slice.fill }])
    ),
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-text min-[1440px]:text-[15px]">
          Inventory Value by Category
        </h2>
        <p className="mt-0.5 text-[11.5px] text-text-3 min-[1440px]:text-xs">
          Retail-value split across the current filters
        </p>
      </div>

      {slices.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-14 text-center">
          <p className="text-sm font-semibold text-text">No stock to value</p>
          <p className="max-w-xs text-[12.5px] text-text-3">
            Nothing matches the current search or filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <div className="relative w-full max-w-[240px] shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[210px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      indicator="dot"
                      formatter={(value) => fmtMoney(Number(value))}
                    />
                  }
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="category"
                  innerRadius="64%"
                  outerRadius="96%"
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="var(--color-surface)"
                />
              </PieChart>
            </ChartContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold tracking-tight tabular-nums text-text min-[1440px]:text-xl">
                {formatCompactAed(total)}
              </span>
              <span className="text-[11px] font-medium text-text-3">Total retail</span>
            </div>
          </div>

          <ul className="flex w-full min-w-0 flex-col gap-2.5 lg:flex-1">
            {slices.map((slice) => (
              <li
                key={slice.category}
                className="flex items-center gap-2.5 text-[12.5px] min-[1440px]:text-[13px]"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.fill }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-text-2">{slice.category}</span>
                <span className="font-semibold tabular-nums text-text">
                  {fmtMoney(slice.value)}
                </span>
                <span className="w-11 shrink-0 text-right tabular-nums text-text-3">
                  {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
