import { Badge } from "@/components/ui/badge";
import type { Product, ProductStatus } from "../types";
import { PRODUCT_STATUS_LABELS } from "../types";

const STATUS_TONES: Record<ProductStatus, "green" | "neutral" | "red"> = {
  active: "green",
  inactive: "neutral",
  discontinued: "red",
};

/** 30×30 initial-letter chip; real product images render when uploaded. */
export function ProductThumb({ product, size = 30 }: { product: Product; size?: number }) {
  const initials = product.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-border bg-surface-subtle font-bold text-text-3"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{PRODUCT_STATUS_LABELS[status]}</Badge>;
}