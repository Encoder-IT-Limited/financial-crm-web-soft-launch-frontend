"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdjustmentReason, AdjustmentType } from "../mock-data";

export interface AdjustmentFilters {
  search: string;
  type: AdjustmentType | "all";
  reason: AdjustmentReason | "all";
  range: "all" | "7" | "14" | "30";
  warehouse: string;
}

interface AdjustmentsToolbarProps {
  filters: AdjustmentFilters;
  onChange: (filters: AdjustmentFilters) => void;
  warehouses: string[];
}

const TYPE_OPTIONS: Array<{ value: AdjustmentType; label: string }> = [
  { value: "add", label: "Add" },
  { value: "deduct", label: "Deduct" },
];

const REASON_OPTIONS: Array<{ value: AdjustmentReason; label: string }> = [
  { value: "damage", label: "Damage" },
  { value: "theft", label: "Theft" },
  { value: "audit", label: "Audit" },
  { value: "expiry", label: "Expiry" },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
] as const;

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  width,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  width: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next ?? "")}>
      <SelectTrigger className={width} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export function AdjustmentsToolbar({ filters, onChange, warehouses }: AdjustmentsToolbarProps) {
  const set = <K extends keyof AdjustmentFilters>(key: K, value: AdjustmentFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by adjustment ID, product, or reason..."
          className="pl-9"
          aria-label="Search adjustments"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={filters.type}
          onValueChange={(value) => set("type", value as AdjustmentFilters["type"])}
          placeholder="Type"
          width="w-[120px]"
        >
          <SelectItem value="all">All types</SelectItem>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.reason}
          onValueChange={(value) => set("reason", value as AdjustmentFilters["reason"])}
          placeholder="Reason"
          width="w-[130px]"
        >
          <SelectItem value="all">All reasons</SelectItem>
          {REASON_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.range}
          onValueChange={(value) => set("range", value as AdjustmentFilters["range"])}
          placeholder="Date Range"
          width="w-[140px]"
        >
          {RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.warehouse}
          onValueChange={(value) => set("warehouse", value)}
          placeholder="Warehouse"
          width="w-[160px]"
        >
          <SelectItem value="all">All warehouses</SelectItem>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse} value={warehouse}>
              {warehouse}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>
    </div>
  );
}
