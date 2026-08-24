import { cn } from "@/lib/utils";
import type { Product } from "../types";

export type StockTone = "green" | "amber" | "red";

export function getStockTone(stock: number, minimumStock = 0): StockTone {
  if (minimumStock > 0 && stock <= minimumStock) return "red";
  if (stock >= 50) return "green";
  if (stock >= 20) return "amber";
  return "red";
}

export const STOCK_TONE_LABEL: Record<StockTone, string> = {
  green: "Good stock",
  amber: "Medium stock",
  red: "Low stock",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function ProductThumbnail({
  product,
  className,
}: {
  product: Pick<Product, "name" | "category">;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg bg-blue-l text-[11px] font-bold text-blue",
        className
      )}
    >
      {initials(product.name)}
    </span>
  );
}
