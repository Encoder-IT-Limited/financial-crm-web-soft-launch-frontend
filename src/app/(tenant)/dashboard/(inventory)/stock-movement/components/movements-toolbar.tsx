"use client";

import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MovementKind } from "../mock-data";

export interface MovementFilters {
  search: string;
  kind: MovementKind | "all";
  range: "all" | "7" | "14" | "30";
  warehouse: string;
}

interface MovementsToolbarProps {
  filters: MovementFilters;
  onChange: (filters: MovementFilters) => void;
  warehouses: string[];
  onExport: () => void;
}

const KIND_OPTIONS: Array<{ value: MovementKind; label: string }> = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
  { value: "adjustment", label: "Adjustment" },
  { value: "transfer", label: "Transfer" },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
] as const;

export function MovementsToolbar({ filters, onChange, warehouses, onExport }: MovementsToolbarProps) {
  const set = <K extends keyof MovementFilters>(key: K, value: MovementFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by product, SKU, or reference..."
          className="pl-9"
          aria-label="Search movements"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.kind}
          onValueChange={(value) => set("kind", value as MovementFilters["kind"])}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {KIND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.range}
          onValueChange={(value) => set("range", value as MovementFilters["range"])}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by date range">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.warehouse}
          onValueChange={(value) => set("warehouse", value ?? "all")}
        >
          <SelectTrigger className="w-[170px]" aria-label="Filter by warehouse">
            <SelectValue placeholder="Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All warehouses</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse} value={warehouse}>
                {warehouse}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onExport}>
          <Download data-icon-size />
          Export
        </Button>
      </div>
    </div>
  );
}
