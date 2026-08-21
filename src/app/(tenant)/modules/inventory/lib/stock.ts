import type { Batch, Product, StockLevel, StockSnapshot, StockStatus, Warehouse } from "../types";
import { suggestBatches } from "./batch";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
  negative: "Negative",
};

export const STOCK_STATUS_TONES: Record<StockStatus, "green" | "amber" | "red"> = {
  "in-stock": "green",
  low: "amber",
  out: "red",
  negative: "red",
};

export function warehouseName(warehouses: Warehouse[], id: string): string {
  return warehouses.find((w) => w.id === id)?.name ?? "—";
}

export function warehouseCode(warehouses: Warehouse[], id: string): string {
  return warehouses.find((w) => w.id === id)?.code ?? "—";
}

/** Reorder threshold for a product at a warehouse — per-warehouse override wins. */
export function reorderLevelFor(product: Product, warehouseId: string): number {
  return product.reorderLevels[warehouseId] ?? product.reorderLevel;
}

export function reorderQuantityFor(product: Product, warehouseId: string): number {
  return product.reorderQuantities[warehouseId] ?? 0;
}

export function stockLevelFor(productId: string, warehouseId: string, levels: StockLevel[]): StockLevel | undefined {
  return levels.find((l) => l.productId === productId && l.warehouseId === warehouseId);
}

/** Per-warehouse snapshot with a derived health status. */
export function stockSnapshot(level: StockLevel | undefined, product: Product): StockSnapshot {
  const available = level?.quantity ?? 0;
  const onHand = available + (level?.reserved ?? 0);
  const reorder = reorderLevelFor(product, level?.warehouseId ?? "");
  return {
    onHand,
    reserved: level?.reserved ?? 0,
    available,
    status: deriveStatus(available, reorder),
  };
}

/** in-stock → low (available ≤ reorder level) → out (≤ 0) → negative (< 0). */
export function deriveStatus(available: number, reorderLevel: number): StockStatus {
  if (available < 0) return "negative";
  if (available <= 0) return "out";
  if (reorderLevel > 0 && available <= reorderLevel) return "low";
  return "in-stock";
}

export type ConsolidatedStock = {
  available: number;
  reserved: number;
  inTransit: number;
  damaged: number;
  /** Inventory value using each warehouse's weighted-average cost. */
  value: number;
  /** Blended weighted-average cost per unit (falls back to product cost). */
  averageCost: number;
  status: StockStatus;
  warehousesWithStock: number;
};

/** Aggregate a product's stock across all warehouses. */
export function consolidateStock(product: Product, levels: StockLevel[]): ConsolidatedStock {
  const own = levels.filter((l) => l.productId === product.id);
  const available = own.reduce((sum, l) => sum + l.quantity, 0);
  const value = own.reduce((sum, l) => sum + l.quantity * l.averageCost, 0);
  const averageCost = available !== 0 ? value / available : product.costPrice;

  const anyNegative = own.some((l) => l.quantity < 0);
  const anyLow = own.some((l) => l.quantity > 0 && l.quantity <= reorderLevelFor(product, l.warehouseId));

  return {
    available,
    reserved: own.reduce((sum, l) => sum + l.reserved, 0),
    inTransit: own.reduce((sum, l) => sum + l.inTransit, 0),
    damaged: own.reduce((sum, l) => sum + l.damaged, 0),
    value,
    averageCost,
    status: anyNegative ? "negative" : available <= 0 ? "out" : anyLow ? "low" : "in-stock",
    warehousesWithStock: own.filter((l) => l.quantity !== 0).length,
  };
}

/* ------------------------------ Batches ----------------------------- */

export type BatchHealth = "active" | "expiring" | "expired";

export function batchHealth(batch: Batch): BatchHealth {
  if (!batch.expiryDate) return "active";
  const days = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

export const BATCH_HEALTH_LABELS: Record<BatchHealth, string> = {
  active: "Active",
  expiring: "Expiring soon",
  expired: "Expired",
};

export const BATCH_HEALTH_TONES: Record<BatchHealth, "green" | "amber" | "red"> = {
  active: "green",
  expiring: "amber",
  expired: "red",
};

export type FefoRecommendation = {
  warehouseId: string;
  batch: Batch | null;
  reasonLabel: string;
  daysLeft: number | null;
};

/** FEFO/FIFO consumption priority per warehouse (drives the visualizer). */
export function fefoPerWarehouse(
  batches: Batch[],
  productId: string,
  warehouses: Warehouse[]
): FefoRecommendation[] {
  return warehouses.map((wh) => {
    const suggestions = suggestBatches(batches, productId, wh.id);
    const recommended =
      suggestions.find((s) => s.recommend) ??
      // Warehouse may hold stock without a pickable batch (quantity sits in quarantine)
      suggestions[0] ??
      null;
    if (!recommended) return { warehouseId: wh.id, batch: null, reasonLabel: "", daysLeft: null };
    return {
      warehouseId: wh.id,
      batch: recommended.batch,
      reasonLabel: recommended.reasonLabel,
      daysLeft: recommended.batch.expiryDate
        ? Math.ceil((new Date(recommended.batch.expiryDate).getTime() - Date.now()) / 86_400_000)
        : null,
    };
  });
}