"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { productLookupApi, stockAt } from "../../invoices/api/product-lookup.service";
import type { ProductLookupItem } from "../../invoices/mock/product-lookup-seed";
import { ProductTile } from "./product-tile";

/** Search box (also where a barcode scanner's fast text input lands —
 * scanners just "type" the code into whatever's focused) + a tap-to-add
 * product grid. Deliberately its own small component, not folded into
 * the register screen. */
export function ProductSearchPanel({ warehouseId, onAdd }: { warehouseId: string; onAdd: (product: ProductLookupItem) => void }) {
  const { data: products = [], isLoading } = useQuery({ queryKey: ["pos-products"], queryFn: productLookupApi.listProducts });
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(needle));
  }, [products, search]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-4" />
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Scan a barcode or search products..."
          className="pl-9"
        />
      </div>

      {isLoading && <div className="p-8 text-center text-[13px] text-text-4">Loading products…</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="p-8 text-center text-[13px] text-text-4">No products match &ldquo;{search}&rdquo;.</div>
      )}

      <div className="grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-2 min-[1440px]:grid-cols-3">
        {filtered.map((product) => (
          <ProductTile key={product.id} product={product} stock={stockAt(product, warehouseId)} onAdd={() => onAdd(product)} />
        ))}
      </div>
    </div>
  );
}
