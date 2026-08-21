"use client";

import { Card } from "@/components/ui/card";
import { fmtDate } from "@/lib/format";
import type { Product } from "../types";
import { PRODUCT_STATUS_LABELS } from "../types";
import { ProductThumb } from "./product-thumb";

export function ProductGeneralTab({ product }: { product: Product }) {
  const rows: [string, string][] = [
    ["SKU", product.sku],
    ["Barcode", product.barcode || "—"],
    ["Category", product.category],
    ["Unit (UOM)", product.unit],
    ["Status", PRODUCT_STATUS_LABELS[product.status]],
    ["Batch tracking", product.trackBatch ? "Enabled" : "Off"],
    ["Expiry tracking (FEFO)", product.trackExpiry ? "Enabled" : "Off"],
    ["Created", fmtDate(product.createdAt)],
  ];

  return (
    <Card className="gap-0 p-0">
      <div className="flex items-start gap-4 border-b border-border p-5">
        <ProductThumb product={product} size={56} />
        <div className="flex flex-col gap-1">
          <div className="text-[15px] font-bold text-text">{product.name}</div>
          <div className="text-[11.5px] text-text-3">
            {product.category} · sold per {product.unit} · {PRODUCT_STATUS_LABELS[product.status]}
          </div>
          {product.images.length > 0 && (
            <div className="mt-1 flex gap-2">
              {product.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={`${product.name} image`} className="h-14 w-14 rounded-md border border-border object-cover" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">{label}</span>
            <span className="text-[13px] font-semibold text-text">{value}</span>
          </div>
        ))}
      </div>

      {product.description && (
        <div className="border-t border-border px-5 py-4">
          <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-text-4">Description</div>
          <p className="text-[12.5px] leading-relaxed text-text-2">{product.description}</p>
        </div>
      )}
    </Card>
  );
}