import { products, type ProductCategory } from "../products/mock-data";

export type StockLevel = "critical" | "low";

export type ReorderStatus = "draft" | "pending-approval" | "ordered" | "received";

export interface LowStockItem {
  sku: string;
  productName: string;
  category: ProductCategory;
  warehouse: string;
  currentQty: number;
  /** At or below this the item is Critical. */
  minStock: number;
  /** Below this (and above minStock) the item is Low. */
  reorderPoint: number;
  /** ISO date (yyyy-MM-dd). */
  lastRestocked: string;
  supplier: string;
}

export interface PurchaseReorder {
  id: string;
  sku: string;
  productName: string;
  category: ProductCategory;
  supplier: string;
  requestedQty: number;
  status: ReorderStatus;
  /** ISO date (yyyy-MM-dd). */
  expectedDelivery: string;
  notes: string;
}

/** Data submitted by the Create Reorder dialog. */
export interface ReorderSaveData {
  sku: string;
  requestedQty: number;
  expectedDelivery: string;
  notes: string;
}

const product = (sku: string) => {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error(`Unknown SKU in reorder seed: ${sku}`);
  return found;
};

/** Critical once at/below minStock, otherwise Low while under the reorder point. */
export function getItemLevel(item: LowStockItem): StockLevel {
  return item.currentQty <= item.minStock ? "critical" : "low";
}

export const STOCK_LEVEL_LABEL: Record<StockLevel, string> = {
  critical: "Critical",
  low: "Low",
};

/** Recommended top-up: enough to reach twice the reorder point. */
export function suggestedReorderQty(item: LowStockItem): number {
  return Math.max(item.reorderPoint * 2 - item.currentQty, 1);
}

const GULF = "Gulf Tech Trading";
const EOS = "Emirates Office Supplies";
const ALAIN = "Al Ain Electronics";
const SHJ_FURN = "Sharjah Furniture Co.";
const DXB_DIGI = "Dubai Digital Devices";

const MAIN = "Main Warehouse";
const DXB = "Dubai Warehouse";
const AUH = "Abu Dhabi Warehouse";
const SHJ = "Sharjah Warehouse";
const JEB = "Jebel Ali Warehouse";

const lowStockItem = (
  sku: string,
  warehouse: string,
  currentQty: number,
  minStock: number,
  reorderPoint: number,
  lastRestocked: string,
  supplier: string
): LowStockItem => {
  const p = product(sku);
  return {
    sku: p.sku,
    productName: p.name,
    category: p.category,
    warehouse,
    currentQty,
    minStock,
    reorderPoint,
    lastRestocked,
    supplier,
  };
};

/** Mock low-stock items — swap for the inventory API response later. */
export const lowStockItems: LowStockItem[] = [
  lowStockItem("M90-BLK", MAIN, 4, 20, 50, "2026-07-28", DXB_DIGI),
  lowStockItem("WH1000XM5", DXB, 3, 10, 25, "2026-08-02", GULF),
  lowStockItem("K1500", AUH, 8, 15, 40, "2026-07-15", EOS),
  lowStockItem("DL-M24-1080", MAIN, 18, 10, 30, "2026-06-30", ALAIN),
  lowStockItem("CH-ERGO-BLK", SHJ, 26, 12, 35, "2026-05-18", SHJ_FURN),
  lowStockItem("PP-A4-80G", DXB, 60, 50, 150, "2026-08-01", EOS),
  lowStockItem("HP15-I5-8GB", JEB, 42, 15, 45, "2026-07-05", GULF),
  lowStockItem("SD-140-OAK", MAIN, 15, 6, 18, "2026-04-22", SHJ_FURN),
  lowStockItem("ST-HD-BLK", AUH, 24, 12, 30, "2026-03-30", ALAIN),
  lowStockItem("PN-BLU-50", SHJ, 55, 30, 80, "2026-06-10", EOS),
];

const reorder = (
  id: string,
  sku: string,
  supplier: string,
  requestedQty: number,
  status: ReorderStatus,
  expectedDelivery: string,
  notes = ""
): PurchaseReorder => {
  const p = product(sku);
  return {
    id,
    sku: p.sku,
    productName: p.name,
    category: p.category,
    supplier,
    requestedQty,
    status,
    expectedDelivery,
    notes,
  };
};

/** Mock reorders — swap for the purchasing API response later.
 * Dates are anchored around Aug 2026 so statuses stay meaningful. */
export const purchaseReorders: PurchaseReorder[] = [
  reorder("RO-2026-014", "IP15-PRO-256", GULF, 30, "pending-approval", "2026-08-28"),
  reorder("RO-2026-013", "PP-A4-80G", EOS, 200, "ordered", "2026-08-26"),
  reorder("RO-2026-012", "M90-BLK", DXB_DIGI, 100, "pending-approval", "2026-08-25", "Urgent — stockout risk this week"),
  reorder("RO-2026-011", "CH-ERGO-BLK", SHJ_FURN, 20, "ordered", "2026-09-02"),
  reorder("RO-2026-010", "WH1000XM5", GULF, 15, "draft", "2026-08-24"),
  reorder("RO-2026-009", "DL-M24-1080", ALAIN, 25, "ordered", "2026-08-30"),
  reorder("RO-2026-008", "PN-BLU-50", EOS, 80, "pending-approval", "2026-08-22"),
  reorder("RO-2026-007", "SM-S24-256", DXB_DIGI, 20, "received", "2026-08-20"),
  reorder("RO-2026-006", "K1500", EOS, 60, "draft", "2026-09-05"),
  reorder("RO-2026-005", "HP15-I5-8GB", GULF, 30, "received", "2026-08-18"),
  reorder("RO-2026-004", "SD-140-OAK", SHJ_FURN, 10, "ordered", "2026-08-27"),
  reorder("RO-2026-003", "FC-3D-GREY", SHJ_FURN, 15, "received", "2026-08-15"),
  reorder("RO-2026-002", "ST-HD-BLK", ALAIN, 40, "ordered", "2026-09-01"),
  reorder("RO-2026-001", "IP15-PRO-256", GULF, 25, "received", "2026-08-12"),
];

export const REORDER_STATUS_LABEL: Record<ReorderStatus, string> = {
  draft: "Draft",
  "pending-approval": "Pending Approval",
  ordered: "Ordered",
  received: "Received",
};

export const REORDER_WAREHOUSES = [MAIN, DXB, AUH, SHJ, JEB];

export function getUnitPrice(sku: string): number {
  return product(sku).price;
}

/** Next sequential RO id for locally created reorders. */
export function nextReorderId(items: PurchaseReorder[]): string {
  const maxNum = items.reduce((max, r) => {
    const num = Number(r.id.split("-").pop());
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `RO-2026-${String(maxNum + 1).padStart(3, "0")}`;
}
