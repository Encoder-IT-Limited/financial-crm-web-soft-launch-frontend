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
import {
  VALUATION_METHOD_LABEL,
  VALUATION_RANGE_OPTIONS,
  type ValuationMethod,
  type ValuationRange,
} from "../mock-data";

export interface ValuationFilters {
  search: string;
  warehouse: string;
  category: string;
  method: ValuationMethod;
  range: ValuationRange;
}

interface ValuationToolbarProps {
  filters: ValuationFilters;
  onChange: (filters: ValuationFilters) => void;
  warehouses: string[];
  categories: string[];
}

export function ValuationToolbar({
  filters,
  onChange,
  warehouses,
  categories,
}: ValuationToolbarProps) {
  const set = <K extends keyof ValuationFilters>(key: K, value: ValuationFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by product, SKU, or category..."
          className="pl-9"
          aria-label="Search valuation lines"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

        <Select
          value={filters.category}
          onValueChange={(value) => set("category", value ?? "all")}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.method}
          onValueChange={(value) => set("method", (value ?? "fifo") as ValuationMethod)}
        >
          <SelectTrigger className="w-[180px]" aria-label="Valuation method">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(VALUATION_METHOD_LABEL) as ValuationMethod[]).map((method) => (
              <SelectItem key={method} value={method}>
                {VALUATION_METHOD_LABEL[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.range}
          onValueChange={(value) => set("range", (value ?? "all") as ValuationRange)}
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by date range">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {VALUATION_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
