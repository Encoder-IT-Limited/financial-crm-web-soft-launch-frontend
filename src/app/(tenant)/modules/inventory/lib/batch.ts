import { daysFromNow } from "@/lib/format";
import type { Batch } from "../types";

export type BatchSuggestion = {
  batch: Batch;
  reason: "fefo" | "fifo";
  reasonLabel: string;
  recommend: boolean;
};

/**
 * Suggest the batch(es) stock should be deducted from for a product in a
 * warehouse.
 *
 * FEFO (first-expiry-first-out) wins when any batch carries an expiry date —
 * the batch whose expiry is nearest is consumed first. If no batch is
 * expiring-tracked (or none has an expiry set), fall back to FIFO using the
 * batch creation date (oldest received first). Batches already exhausted or
 * quarantined are excluded.
 */
export function suggestBatches(batches: Batch[], productId: string, warehouseId: string): BatchSuggestion[] {
  const candidates = batches
    .filter(
      (b) =>
        b.productId === productId &&
        b.warehouseId === warehouseId &&
        b.quantity - b.quarantineQuantity > 0.0001
    )
    .sort((a, b) => (a.expiryDate ?? "").localeCompare(b.expiryDate ?? ""));

  if (candidates.length === 0) return [];

  const anyExpiry = candidates.some((b) => b.expiryDate);
  const suggested = anyExpiry ? candidates[0] : candidates.reduce((oldest, b) => (b.createdAt < oldest.createdAt ? b : oldest), candidates[0]);

  const isExpiryTracked = anyExpiry && suggested.expiryDate;
  const days = daysFromNow(isExpiryTracked ? suggested.expiryDate : suggested.createdAt);

  const reasonLabel = isExpiryTracked
    ? days === null
      ? "FEFO — earliest expiry"
      : days < 0
        ? `FEFO — expired ${Math.abs(days)}d ago`
        : `FEFO — expires in ${days}d`
    : `FIFO — received ${days === null ? "" : `${Math.max(1, days)}d ago`}`;

  return candidates.map((b) => ({
    batch: b,
    reason: isExpiryTracked ? "fefo" : "fifo",
    reasonLabel,
    recommend: b.id === suggested.id,
  }));
}

export function suggestedBatchId(batches: Batch[], productId: string, warehouseId: string): string | null {
  return suggestBatches(batches, productId, warehouseId).find((s) => s.recommend)?.batch.id ?? null;
}

/** Deduct `qty` from the given batches in suggestion order — used by sales /
 * transfer dispatch so quantity tracking stays honest per batch. */
export function consumeBatches(batches: Batch[], productId: string, warehouseId: string, qty: number): string[] {
  const suggestions = suggestBatches(batches, productId, warehouseId);
  let remaining = qty;
  const consumed: string[] = [];

  for (const s of suggestions) {
    if (remaining <= 0.0001) break;
    const take = Math.min(s.batch.quantity - s.batch.quarantineQuantity, remaining);
    if (take > 0) {
      s.batch.quantity -= take;
      consumed.push(s.batch.id);
      remaining -= take;
    }
  }
  return consumed;
}