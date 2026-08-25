"use client";

import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductLookupItem } from "../../invoices/mock/product-lookup-seed";

export function ProductTile({
  product,
  stock,
  onAdd,
}: {
  product: ProductLookupItem;
  stock: number;
  onAdd: () => void;
}) {
  const outOfStock = stock <= 0;
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onAdd}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAdd()}
      className={cn(
        "flex cursor-pointer flex-col gap-1 p-3 transition-colors hover:border-blue",
        outOfStock && "opacity-60"
      )}
    >
      <div className="line-clamp-2 text-[12.5px] font-semibold text-text">{product.name}</div>
      <div className="text-[11px] text-text-3">{product.sku}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[13px] font-bold text-blue">{fmtMoney(product.price)}</span>
        <span className={cn("text-[11px]", outOfStock ? "text-red" : "text-text-3")}>
          {outOfStock ? "Out of stock" : `${stock} in stock`}
        </span>
      </div>
    </Card>
  );
}
