"use client";

import { Boxes, Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Warehouse } from "../types";

export type StockViewMode = "total" | "local";

/** Global vs. Local stock view — swaps the list's stock column between
 * "Total (All Warehouses)" and a single selected warehouse. */
export function StockViewToggle({
  mode,
  onModeChange,
  warehouseId,
  onWarehouseChange,
  warehouses,
  disabled,
}: {
  mode: StockViewMode;
  onModeChange: (mode: StockViewMode) => void;
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  warehouses: Warehouse[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-lg bg-surface-subtle p-[3px]">
        <button
          type="button"
          onClick={() => onModeChange("total")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all",
            mode === "total" ? "bg-surface text-text shadow-sm" : "text-text-3 hover:text-text"
          )}
        >
          <Boxes className="size-3.5" />
          All Warehouses
        </button>
        <button
          type="button"
          onClick={() => onModeChange("local")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all",
            mode === "local" ? "bg-surface text-text shadow-sm" : "text-text-3 hover:text-text"
          )}
        >
          <Store className="size-3.5" />
          Per Warehouse
        </button>
      </div>
      {mode === "local" && (
        <Select value={warehouseId} onValueChange={(v) => onWarehouseChange(v ?? "")} disabled={disabled}>
          <SelectTrigger size="sm" className="min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}