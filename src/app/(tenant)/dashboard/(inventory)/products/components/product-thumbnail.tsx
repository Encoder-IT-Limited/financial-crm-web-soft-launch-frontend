import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "../mock-data";

export type StockTone = "green" | "amber" | "red";

const CATEGORY_TILE_CLASS: Record<ProductCategory, string> = {
  Laptops: "bg-blue-l text-blue",
  Accessories: "bg-purple-l text-purple",
  Furniture: "bg-amber-l text-amber",
  Office: "bg-green-l text-green",
  Services: "bg-surface-subtle text-text-3",
};

export function getStockTone(stock: number): StockTone {
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
        "grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
        CATEGORY_TILE_CLASS[product.category],
        className
      )}
    >
      {initials(product.name)}
    </span>
  );
}
