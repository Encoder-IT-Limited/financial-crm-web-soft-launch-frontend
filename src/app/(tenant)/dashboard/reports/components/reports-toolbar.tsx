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
import { REPORT_CATEGORIES, type ReportCategory } from "../mock-data";

export interface ReportFilters {
  search: string;
  category: ReportCategory | "all";
  range: "all" | "30" | "90" | "180";
}

interface ReportsToolbarProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
] as const;

export function ReportsToolbar({ filters, onChange }: ReportsToolbarProps) {
  const set = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-text-3 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search reports..."
          className="pl-9"
          aria-label="Search reports"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.range}
          onValueChange={(value) => set("range", (value ?? "all") as ReportFilters["range"])}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by date range">
            <SelectValue placeholder="Date Range" />
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
          value={filters.category}
          onValueChange={(value) =>
            set("category", (value ?? "all") as ReportFilters["category"])
          }
        >
          <SelectTrigger className="w-[170px]" aria-label="Filter by report category">
            <SelectValue placeholder="Report Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {REPORT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
