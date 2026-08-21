"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { StockStatus } from "../types";

export type StockBreakdownRow = {
  name: string;
  code: string;
  available: number;
  inTransit: number;
  status: StockStatus;
};

const STATUS_TEXT: Record<StockStatus, string> = {
  "in-stock": "text-green",
  low: "text-amber",
  out: "text-red",
  negative: "text-red",
};

/** Per-warehouse stock breakdown shown on the list's stock cell (hover). */
export function WarehouseStockTooltip({ rows, children }: { rows: StockBreakdownRow[]; children: ReactNode }) {
  if (rows.length === 0) return <>{children}</>;
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger className="cursor-help">{children}</TooltipTrigger>
        <TooltipContent side="right" align="start" className="w-56 p-0">
          <div className="w-full p-1.5">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-text-3">
              Stock by warehouse
            </div>
            <div className="flex flex-col">
              {rows.map((row) => (
                <div key={row.code} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-subtle">
                  <div className="flex flex-col">
                    <span className="text-[11.5px] font-semibold text-text">{row.name}</span>
                    <span className="text-[10px] text-text-4">
                      {row.inTransit > 0 ? `${row.inTransit} in transit` : row.code}
                    </span>
                  </div>
                  <span className={cn("text-[12px] font-bold tabular-nums", STATUS_TEXT[row.status])}>{row.available}</span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}