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
import type { BatchStatus } from "../mock-data";

export interface BatchFilters {
  search: string;
  product: string;
  warehouse: string;
  status: BatchStatus | "all";
  range: "all" | "7" | "14" | "30";
}

interface BatchesToolbarProps {
  filters: BatchFilters;
  onChange: (filters: BatchFilters) => void;
  products: string[];
  warehouses: string[];
}

const STATUS_OPTIONS: Array<{ value: BatchStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "expiring-soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

/** Forward-looking presets — for batches the useful window is upcoming
 * expiries, not past dates. */
const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Next 7 days" },
  { value: "14", label: "Next 14 days" },
  { value: "30", label: "Next 30 days" },
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

export function BatchesToolbar({ filters, onChange, products, warehouses }: BatchesToolbarProps) {
  const set = <K extends keyof BatchFilters>(key: K, value: BatchFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by batch number, product, or SKU..."
          className="pl-9"
          aria-label="Search batches"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={filters.product}
          onValueChange={(value) => set("product", value)}
          placeholder="Product"
          width="w-[170px]"
        >
          <SelectItem value="all">All products</SelectItem>
          {products.map((product) => (
            <SelectItem key={product} value={product}>
              {product}
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

        <FilterSelect
          value={filters.status}
          onValueChange={(value) => set("status", value as BatchFilters["status"])}
          placeholder="Status"
          width="w-[150px]"
        >
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.range}
          onValueChange={(value) => set("range", value as BatchFilters["range"])}
          placeholder="Date Range"
          width="w-[140px]"
        >
          {RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>
    </div>
  );
}
