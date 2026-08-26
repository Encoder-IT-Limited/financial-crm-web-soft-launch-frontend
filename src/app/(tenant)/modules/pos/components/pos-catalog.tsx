"use client";

import { useMemo, useRef } from "react";
import { Search, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/app/(tenant)/modules/inventory/types";
import { PosProductTile } from "./pos-product-tile";

export function PosCatalog({
  products,
  loading,
  query,
  onQueryChange,
  onSubmitQuery,
  onAdd,
  disabled,
}: {
  products: Product[];
  loading?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitQuery: () => void;
  onAdd: (product: Product) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["All", ...[...set].sort()];
  }, [products]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitQuery();
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-4" />
        <Input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Scan barcode or search name / SKU"
          className="h-11 rounded-xl border-border bg-surface pl-9 pr-10 text-[14px]"
          disabled={disabled}
        />
        <ScanLine className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-4" />
      </form>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {categories.slice(0, 12).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onQueryChange(cat === "All" ? "" : cat === query ? "" : cat)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold ${
              (cat === "All" && !query) || query === cat
                ? "bg-navy text-white"
                : "bg-surface-subtle text-text-3 hover:text-text"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[108px] rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle px-6 text-center">
            <ScanLine className="mb-2 size-8 text-text-4" />
            <p className="text-[14px] font-bold text-text">No matching products</p>
            <p className="mt-1 max-w-xs text-[12.5px] text-text-3">
              Scan a barcode, or search by name. Out-of-stock items stay visible but can’t be added.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3 2xl:grid-cols-4">
            {products.map((p) => (
              <PosProductTile key={p.id} product={p} onAdd={onAdd} disabled={disabled} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
