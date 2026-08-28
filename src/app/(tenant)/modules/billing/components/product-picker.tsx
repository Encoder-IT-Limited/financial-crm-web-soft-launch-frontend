"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  productLookupApi,
  stockAt,
  type ProductLookupItem,
} from "@/app/(tenant)/dashboard/invoices/api/product-lookup.service";

const CUSTOM = "custom";

export function ProductPicker({
  productId,
  warehouseId,
  onPick,
  invalid,
}: {
  productId?: string;
  warehouseId?: string;
  onPick: (product: ProductLookupItem | null) => void;
  invalid?: boolean;
}) {
  const { data: products = [] } = useQuery({
    queryKey: ["billing-product-lookup"],
    queryFn: productLookupApi.listProducts,
    staleTime: 30_000,
  });

  const selected = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );
  const onHand = selected ? stockAt(selected, warehouseId) : null;

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={productId || CUSTOM}
        onValueChange={(v) => {
          if (!v || v === CUSTOM) {
            onPick(null);
            return;
          }
          const product = products.find((p) => p.id === v);
          onPick(product ?? null);
        }}
      >
        <SelectTrigger
          size="sm"
          className={cn("w-full", invalid && "border-red")}
        >
          <SelectValue placeholder="Pick a product">
            {(value: string) => {
              if (!value || value === CUSTOM) return "Custom / service line";
              const product = products.find((p) => p.id === value);
              return product
                ? `${product.name} — ${product.sku} `
                : "Pick a product";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CUSTOM}>Custom / service line</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name} — {product.sku}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && warehouseId && (
        <p
          className={cn(
            "text-[10.5px]",
            onHand === 0 ? "text-amber" : "text-text-4",
          )}
        >
          {onHand} in stock at selected warehouse
        </p>
      )}
    </div>
  );
}

export function WarehousePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (warehouseId: string) => void;
}) {
  const { data: warehouses = [] } = useQuery({
    queryKey: ["billing-warehouse-lookup"],
    queryFn: productLookupApi.listWarehouses,
    staleTime: 60_000,
  });

  return (
    <Select value={value || ""} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Warehouse">
          {(v: string) =>
            warehouses.find((wh) => wh.id === v)?.name ?? "Warehouse"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {warehouses.map((wh) => (
          <SelectItem key={wh.id} value={wh.id}>
            {wh.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
