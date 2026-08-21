"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Warehouse } from "../types";

/** Multi-select warehouse filter used in the products list toolbar. */
export function WarehouseMultiSelect({
  warehouses,
  selected,
  onChange,
  disabled,
}: {
  warehouses: Warehouse[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };
  const label =
    selected.length === 0
      ? "All warehouses"
      : selected.length === 1
        ? warehouses.find((w) => w.id === selected[0])?.name ?? "1 selected"
        : `${selected.length} warehouses`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-[12.5px] font-medium whitespace-nowrap text-text-2 transition-colors outline-none select-none hover:bg-surface-subtle data-open:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"
        )}
      >
        <SlidersHorizontal className="size-3.5" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Filter by warehouse</DropdownMenuLabel>
        {warehouses.map((wh) => (
          <DropdownMenuCheckboxItem
            key={wh.id}
            checked={selected.includes(wh.id)}
            onCheckedChange={() => toggle(wh.id)}
          >
            <span className="flex flex-col">
              <span className="text-[12.5px]">{wh.name}</span>
              <span className="text-[10.5px] text-text-4">{wh.code}</span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full rounded-md border-t border-border px-1.5 py-1.5 text-left text-[11px] font-bold text-blue hover:bg-surface-subtle"
          >
            Clear selection
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}