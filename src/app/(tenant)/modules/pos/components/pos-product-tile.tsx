"use client";

import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import type { Product } from "@/app/(tenant)/modules/inventory/types";

export function PosProductTile({
  product,
  onAdd,
  disabled,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  disabled?: boolean;
}) {
  const out = product.stock <= 0;
  const low = !out && product.stock <= Math.max(product.reorderLevel, product.minimumStock, 0);

  return (
    <button
      type="button"
      disabled={disabled || out}
      onClick={() => onAdd(product)}
      className={cn(
        "flex min-h-[108px] flex-col items-start rounded-2xl border border-border bg-surface p-3 text-left transition-all",
        "hover:border-blue/40 hover:shadow-sm active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40",
        "disabled:pointer-events-none disabled:opacity-45",
      )}
    >
      <span className="line-clamp-2 text-[13px] font-bold leading-snug text-text">{product.name}</span>
      <span className="mt-0.5 font-mono text-[10.5px] text-text-4">{product.sku}</span>
      <div className="mt-auto flex w-full items-end justify-between gap-2 pt-2">
        <span className="text-[14px] font-extrabold tabular-nums text-text">{fmtMoney(product.price)}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            out && "bg-red-l text-red",
            low && "bg-amber-l text-amber",
            !out && !low && "bg-green-l text-green",
          )}
        >
          {out ? "Out" : `${product.stock} left`}
        </span>
      </div>
    </button>
  );
}
