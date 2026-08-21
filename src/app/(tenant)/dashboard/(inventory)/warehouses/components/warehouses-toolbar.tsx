"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WarehouseStatus } from "../mock-data";

export type WarehousesToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  status: WarehouseStatus | "all";
  onStatusChange: (value: WarehouseStatus | "all") => void;
  locations: string[];
};

const triggerClass = "h-9 w-[140px] border-border text-[12.5px] min-[1440px]:text-[13.5px]";

export function WarehousesToolbar({
  search,
  onSearchChange,
  location,
  onLocationChange,
  status,
  onStatusChange,
  locations,
}: WarehousesToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-4" />
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search warehouses..."
          className="h-9 border-border pl-9 text-[12.5px] min-[1440px]:text-[13.5px]"
        />
      </div>

      <Select value={location} onValueChange={(value) => onLocationChange(value ?? "all")}>
        <SelectTrigger className={triggerClass} aria-label="Filter by location">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All locations</SelectItem>
          {locations.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange((value ?? "all") as WarehouseStatus | "all")}
      >
        <SelectTrigger className={triggerClass} aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => {
          onSearchChange("");
          onLocationChange("all");
          onStatusChange("all");
        }}
      >
        Reset
      </Button>
    </div>
  );
}
