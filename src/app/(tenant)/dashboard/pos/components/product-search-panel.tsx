"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { inventoryApi } from "@/app/(tenant)/modules/inventory/api/inventory.service";
import type { ProductLookupItem } from "../../invoices/mock/product-lookup-seed";
import { ProductTile } from "./product-tile";

function stockAt(item: ProductLookupItem, warehouseId: string): number {
  return item.stockByWarehouse[warehouseId] ?? 0;
}

/** Search box (also where a barcode scanner's fast text input lands —
 * scanners just "type" the code into whatever's focused) + a tap-to-add
 * product grid. Catalog comes from live inventory; stock is per warehouse. */
export function ProductSearchPanel({ warehouseId, onAdd }: { warehouseId: string; onAdd: (product: ProductLookupItem) => void }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["pos-products", warehouseId],
    queryFn: async (): Promise<ProductLookupItem[]> => {
      const [catalog, stock] = await Promise.all([inventoryApi.listProducts(), inventoryApi.listStock()]);
      return catalog
        .filter((p) => p.status === "active")
        .map((p) => {
          const stockByWarehouse: Record<string, number> = {};
          for (const row of stock) {
            if (row.productId === p.id) stockByWarehouse[row.warehouseId] = row.quantity;
          }
          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            taxRate: p.taxRate ?? 5,
            stockByWarehouse,
          };
        });
    },
  });
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
