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
import { Button } from "@/components/ui/button";
import type { ProductStatus } from "../types";

export type SortPreset =
  | "featured"
  | "name-asc"
  | "stock-asc"
  | "stock-desc"
  | "price-asc"
  | "price-desc";

export type ProductsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  category: string;
  onCategoryChange: (value: string) => void;
  status: ProductStatus | "all";
  onStatusChange: (value: ProductStatus | "all") => void;
  sort: SortPreset;
  onSortChange: (value: SortPreset) => void;
  selectedCount: number;
  onClearSelection: () => void;
};

const triggerClass = "h-9 w-[130px] border-border text-[12.5px]";

export function ProductsToolbar({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  selectedCount,
  onClearSelection,
}: ProductsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onClearSelection}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-l px-3 text-[12.5px] font-medium text-blue"
        >
          {selectedCount} selected · Clear
        </button>
      )}

      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-4" />
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="h-9 border-border pl-9 text-[12.5px]"
        />
      </div>

      <Select value={category} onValueChange={(value) => onCategoryChange(value ?? "all")}>
        <SelectTrigger className={triggerClass} aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange((value ?? "all") as ProductStatus | "all")}
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

      <Select value={sort} onValueChange={(value) => onSortChange((value ?? "featured") as SortPreset)}>
        <SelectTrigger className={triggerClass} aria-label="Sort products">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">Sort by: Featured</SelectItem>
          <SelectItem value="name-asc">Name A–Z</SelectItem>
          <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
          <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => {
          onSearchChange("");
          onCategoryChange("all");
          onStatusChange("all");
          onSortChange("featured");
        }}
      >
        Reset
      </Button>
    </div>
  );
}
