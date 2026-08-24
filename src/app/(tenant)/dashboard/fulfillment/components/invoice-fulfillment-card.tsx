"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/format";
import type { Fulfillment } from "../types";
import { PRODUCT_LOOKUP_ITEMS, PRODUCT_LOOKUP_WAREHOUSES } from "../../invoices/mock/product-lookup-seed";

const TRIGGER_LABELS: Record<Fulfillment["trigger"], string> = {
  "pos-auto": "POS (auto)",
  manual: "Manual",
  "delivery-note": "Delivery Note",
};

/** The invoice detail page's "Fulfillment" card — shipment history for
 * every product-linked line. Only rendered by the caller when the
 * invoice has at least one linked product (Phase I-B). */
export function InvoiceFulfillmentCard({ fulfillments }: { fulfillments: Fulfillment[] }) {
  const productName = (id: string) => PRODUCT_LOOKUP_ITEMS.find((p) => p.id === id)?.name ?? id;
  const warehouseName = (id: string) => PRODUCT_LOOKUP_WAREHOUSES.find((w) => w.id === id)?.name ?? id;

  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Fulfillment</div>
      <div className="flex flex-col divide-y divide-border">
        {fulfillments.map((f) => (
          <div key={f.id} className="px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[13px] font-semibold text-text">
                {f.number ?? TRIGGER_LABELS[f.trigger]}
                {f.number && <span className="ml-1.5 font-normal text-text-3">· {TRIGGER_LABELS[f.trigger]}</span>}
              </div>
              <span className="shrink-0 text-[11px] text-text-3">{fmtDateTime(f.fulfilledAt)}</span>
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              {f.lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-[11.5px] text-text-2">
                  <span>
                    {l.quantityFulfilled}× {productName(l.productId)} — {warehouseName(l.warehouseId)}
                  </span>
                  {l.status === "pending-reconciliation" && (
                    <Badge tone="red" className="shrink-0">
                      Pending reconciliation
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {f.notes && <div className="mt-1 text-[11px] text-text-3">{f.notes}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}
