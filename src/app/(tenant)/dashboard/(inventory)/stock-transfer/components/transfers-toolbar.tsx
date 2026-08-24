"use client";

import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransferStatus } from "../mock-data";

export interface TransferFilters {
  search: string;
  status: TransferStatus | "all";
  from: string;
  to: string;
  range: "all" | "7" | "14" | "30";
}

interface TransfersToolbarProps {
  filters: TransferFilters;
  onChange: (filters: TransferFilters) => void;
  warehouses: string[];
  onExport: () => void;
  onNewTransfer: () => void;
}

const STATUS_OPTIONS: Array<{ value: TransferStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "in-transit", label: "In Transit" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
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

export function TransfersToolbar({
  filters,
  onChange,
  warehouses,
  onExport,
  onNewTransfer,
}: TransfersToolbarProps) {
  const set = <K extends keyof TransferFilters>(key: K, value: TransferFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search transfers by ID, product, or warehouse..."
          className="pl-9"
          aria-label="Search transfers"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={filters.status}
          onValueChange={(value) => set("status", value as TransferFilters["status"])}
          placeholder="Status"
          width="w-[140px]"
        >
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.from}
          onValueChange={(value) => set("from", value)}
          placeholder="From Warehouse"
          width="w-[160px]"
        >
          <SelectItem value="all">From: all</SelectItem>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse} value={warehouse}>
              {warehouse}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.to}
          onValueChange={(value) => set("to", value)}
          placeholder="To Warehouse"
          width="w-[160px]"
        >
          <SelectItem value="all">To: all</SelectItem>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse} value={warehouse}>
              {warehouse}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.range}
          onValueChange={(value) => set("range", value as TransferFilters["range"])}
          placeholder="Date Range"
          width="w-[150px]"
        >
          {RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <Button variant="outline" onClick={onExport}>
          <Download data-icon-size />
          Export
        </Button>

        <Button onClick={onNewTransfer}>
          <Plus data-icon-size />
          New Transfer
        </Button>
      </div>
    </div>
  );
}
