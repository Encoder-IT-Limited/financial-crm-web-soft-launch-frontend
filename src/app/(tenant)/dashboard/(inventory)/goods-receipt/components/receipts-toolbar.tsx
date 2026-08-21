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
import type { ReceiptStatus } from "../mock-data";

export interface ReceiptFilters {
  search: string;
  status: ReceiptStatus | "all";
  supplier: string;
  warehouse: string;
  range: "all" | "7" | "14" | "30";
}

interface ReceiptsToolbarProps {
  filters: ReceiptFilters;
  onChange: (filters: ReceiptFilters) => void;
  suppliers: string[];
  warehouses: string[];
}

const STATUS_OPTIONS: Array<{ value: ReceiptStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "partially-received", label: "Partially Received" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
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

export function ReceiptsToolbar({ filters, onChange, suppliers, warehouses }: ReceiptsToolbarProps) {
  const set = <K extends keyof ReceiptFilters>(key: K, value: ReceiptFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by PO number, supplier, or product..."
          className="pl-9"
          aria-label="Search goods receipts"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={filters.status}
          onValueChange={(value) => set("status", value as ReceiptFilters["status"])}
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
          value={filters.supplier}
          onValueChange={(value) => set("supplier", value)}
          placeholder="Supplier"
          width="w-[170px]"
        >
          <SelectItem value="all">All suppliers</SelectItem>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier} value={supplier}>
              {supplier}
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
          value={filters.range}
          onValueChange={(value) => set("range", value as ReceiptFilters["range"])}
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
