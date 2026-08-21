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
import type { StockLevel } from "../mock-data";

export interface ReorderFilters {
  search: string;
  warehouse: string;
  category: string;
  level: StockLevel | "all";
  supplier: string;
}

interface ReorderToolbarProps {
  filters: ReorderFilters;
  onChange: (filters: ReorderFilters) => void;
  warehouses: string[];
  categories: string[];
  suppliers: string[];
}

const LEVEL_OPTIONS: Array<{ value: StockLevel; label: string }> = [
  { value: "critical", label: "Critical" },
  { value: "low", label: "Low" },
];

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

export function ReorderToolbar({
  filters,
  onChange,
  warehouses,
  categories,
  suppliers,
}: ReorderToolbarProps) {
  const set = <K extends keyof ReorderFilters>(key: K, value: ReorderFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by product, SKU, or supplier..."
          className="pl-9"
          aria-label="Search low stock items and reorders"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
          value={filters.category}
          onValueChange={(value) => set("category", value)}
          placeholder="Category"
          width="w-[140px]"
        >
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.level}
          onValueChange={(value) => set("level", value as ReorderFilters["level"])}
          placeholder="Stock Level"
          width="w-[130px]"
        >
          <SelectItem value="all">All levels</SelectItem>
          {LEVEL_OPTIONS.map((option) => (
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
      </div>
    </div>
  );
}
