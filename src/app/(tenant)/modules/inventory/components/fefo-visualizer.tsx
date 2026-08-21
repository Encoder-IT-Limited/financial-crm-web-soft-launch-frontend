"use client";

import { TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtDate, fmtQty } from "@/lib/format";
import type { Product, Warehouse } from "../types";
import { BATCH_HEALTH_LABELS, BATCH_HEALTH_TONES, batchHealth, fefoPerWarehouse } from "../lib/stock";
import { useInventoryStore } from "../store/inventory-store";

/** FEFO/FIFO consumption priority — which warehouse holds the oldest /
 * nearest-expiry batch, per the suggestion engine in lib/batch.ts. */
export function FefoVisualizer({ product }: { product: Product }) {
  const batches = useInventoryStore((state) => state.batches);
  const warehouses = useInventoryStore((state) => state.warehouses);
  const recommendations = fefoPerWarehouse(batches, product.id, warehouses);

  const withBatches = recommendations.filter((r) => r.batch);
  if (withBatches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-[12.5px] text-text-4">
        No batches tracked for this product yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {recommendations.map((rec) => {
        const wh = warehouses.find((w) => w.id === rec.warehouseId);
        const health = rec.batch ? batchHealth(rec.batch) : null;
        return (
          <div key={rec.warehouseId} className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-text-4">
              <TimerReset className="size-3.5" />
              {wh?.name ?? "Warehouse"}
            </div>
            {rec.batch && health ? (
              <>
                <div className="text-[13px] font-bold text-text">{rec.batch.batchNumber}</div>
                <div className="flex items-center justify-between gap-2 text-[11.5px] text-text-3">
                  <span>Expires {fmtDate(rec.batch.expiryDate)}</span>
                  <Badge tone={BATCH_HEALTH_TONES[health]}>{BATCH_HEALTH_LABELS[health]}</Badge>
                </div>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-text-2">{fmtQty(rec.batch.quantity - rec.batch.quarantineQuantity)} units</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold",
                      health === "expired" ? "bg-red-l text-red" : health === "expiring" ? "bg-amber-l text-amber" : "bg-green-l text-green"
                    )}
                  >
                    {rec.reasonLabel}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-[12px] text-text-4">No pickable batch</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WarehouseCell({ wh, size = "sm" }: { wh: Warehouse | undefined; size?: "sm" | "lg" }) {
  if (!wh) return <span className="text-text-4">—</span>;
  return (
    <div className="flex flex-col">
      <span className={cn("font-semibold text-text", size === "sm" ? "text-[12.5px]" : "text-[13px]")}>{wh.name}</span>
      <span className="text-[10px] text-text-4">{wh.code}</span>
    </div>
  );
}