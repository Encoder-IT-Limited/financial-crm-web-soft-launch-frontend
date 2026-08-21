"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import type { Warehouse } from "../mock-data";

const CATEGORY_COLORS = [
  "var(--color-blue)",
  "var(--color-green)",
  "var(--color-amber)",
  "var(--color-purple)",
  "var(--color-red)",
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0 last:pb-0">
      <span className="text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">{label}</span>
      <span className="text-right text-[12.5px] font-medium text-text min-[1440px]:text-[13.5px]">
        {value}
      </span>
    </div>
  );
}

export function WarehouseDetail({ warehouse }: { warehouse: Warehouse }) {
  const chartData = warehouse.stockByCategory.map((slice, i) => ({
    ...slice,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const chartConfig = Object.fromEntries(
    chartData.map((slice) => [slice.category, { label: slice.category, color: slice.fill }])
  ) satisfies ChartConfig;

  const occupancyPct = Math.min(100, Math.round((warehouse.occupancy / warehouse.capacity) * 100));

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-text min-[1440px]:text-[15px]">
          {warehouse.name}
          <Badge tone={warehouse.status === "active" ? "green" : "neutral"}>
            {warehouse.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </h2>
        <span className="text-[11.5px] text-text-4 min-[1440px]:text-xs">
          Since {warehouse.createdAt}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-subtle p-3.5">
          <div className="text-[11px] font-medium text-text-3">Total Items</div>
          <div className="mt-0.5 text-lg font-extrabold leading-tight text-text min-[1440px]:text-xl">
            {warehouse.totalItems}
          </div>
        </div>
        <div className="rounded-xl bg-surface-subtle p-3.5">
          <div className="text-[11px] font-medium text-text-3">Total Value</div>
          <div className="mt-0.5 text-lg font-extrabold leading-tight text-text min-[1440px]:text-xl">
            {fmtMoney(warehouse.totalValue)}
          </div>
        </div>
        <div className="rounded-xl bg-surface-subtle p-3.5">
          <div className="text-[11px] font-medium text-text-3">Occupancy</div>
          <div className="mt-0.5 text-lg font-extrabold leading-tight text-text tabular-nums min-[1440px]:text-xl">
            {warehouse.occupancy.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl bg-surface-subtle p-3.5">
          <div className="text-[11px] font-medium text-text-3">Capacity</div>
          <div className="mt-0.5 flex items-baseline gap-1.5 text-lg font-extrabold leading-tight text-text tabular-nums min-[1440px]:text-xl">
            {warehouse.capacity.toLocaleString()}
            <span className="text-[11px] font-semibold text-text-3">{occupancyPct}% used</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-4">
            Warehouse Info
          </h3>
          <DetailRow label="Address" value={warehouse.address} />
          <DetailRow label="Manager" value={warehouse.manager} />
          <DetailRow label="Contact Number" value={<span className="tabular-nums">{warehouse.contactNumber}</span>} />
          <DetailRow label="Email" value={warehouse.email} />
          <DetailRow label="Created Date" value={warehouse.createdAt} />
        </div>

        <div>
          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-4">
            Stock by Category
          </h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative w-full max-w-[180px] shrink-0">
              <ChartContainer config={chartConfig} className="aspect-square h-[160px] w-full">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel indicator="dot" />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="items"
                    nameKey="category"
                    innerRadius="62%"
                    outerRadius="96%"
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="var(--color-surface)"
                  />
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-extrabold tracking-tight text-text">
                  {warehouse.totalItems}
                </span>
                <span className="text-[10.5px] font-medium text-text-3">Items</span>
              </div>
            </div>

            <ul className="flex w-full min-w-0 flex-col gap-2">
              {chartData.map((slice) => {
                const pct = ((slice.items / warehouse.totalItems) * 100).toFixed(1);
                return (
                  <li key={slice.category} className="flex items-center gap-2 text-[12px] min-[1440px]:text-[12.5px]">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.fill }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-text-2">{slice.category}</span>
                    <span className="font-semibold tabular-nums text-text">{slice.items}</span>
                    <span className="w-11 shrink-0 text-right tabular-nums text-text-3">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
