import { products, type ProductCategory } from "../products/mock-data";

export type AdjustmentType = "add" | "deduct";

export type AdjustmentReason = "damage" | "theft" | "audit" | "expiry" | "other";

export type AdjustmentStatus = "approved" | "pending";

export interface StockAdjustment {
  id: string;
  /** ISO datetime. */
  date: string;
  type: AdjustmentType;
  productName: string;
  sku: string;
  category: ProductCategory;
  warehouse: string;
  quantity: number;
  reason: AdjustmentReason;
  reference: string;
  status: AdjustmentStatus;
}

const product = (sku: string) => {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error(`Unknown SKU in stock adjustment seed: ${sku}`);
  return found;
};

const row = (
  id: string,
  date: string,
  type: AdjustmentType,
  sku: string,
  warehouse: string,
  quantity: number,
  reason: AdjustmentReason,
  reference: string,
  status: AdjustmentStatus
): StockAdjustment => {
  const p = product(sku);
  return {
    id,
    date,
    type,
    productName: p.name,
    sku: p.sku,
    category: p.category,
    warehouse,
    quantity,
    reason,
    reference,
    status,
  };
};

const MAIN = "Main Warehouse";
const DXB = "Dubai Warehouse";
const AUH = "Abu Dhabi Warehouse";
const SHJ = "Sharjah Warehouse";
const JEB = "Jebel Ali Warehouse";

/** Mock adjustments — swap for the inventory API response later.
 * Dates are anchored around Aug 2026 so the range presets stay meaningful. */
export const stockAdjustments: StockAdjustment[] = [
  row("ADJ-2026-024", "2026-08-21T10:15:00", "deduct", "DL-M24-1080", DXB, 2, "damage", "Two units with cracked screens — supplier claim filed", "approved"),
  row("ADJ-2026-023", "2026-08-21T09:00:00", "add", "PP-A4-80G", MAIN, 12, "audit", "Cycle count surplus found in aisle 4", "approved"),
  row("ADJ-2026-022", "2026-08-20T16:40:00", "deduct", "CH-ERGO-BLK", SHJ, 1, "damage", "Frame bent during handling", "pending"),
  row("ADJ-2026-021", "2026-08-20T14:05:00", "deduct", "M90-BLK", MAIN, 6, "theft", "Missing after weekend stocktake", "approved"),
  row("ADJ-2026-020", "2026-08-20T11:30:00", "add", "IP15-PRO-256", JEB, 4, "audit", "Unlogged carton from GR-2026-014 found", "approved"),
  row("ADJ-2026-019", "2026-08-19T15:50:00", "deduct", "PN-BLU-50", AUH, 8, "expiry", "Past print-quality date, disposed", "approved"),
  row("ADJ-2026-018", "2026-08-19T09:20:00", "deduct", "WH1000XM5", DXB, 1, "damage", "Display unit returned damaged", "pending"),
  row("ADJ-2026-017", "2026-08-18T17:10:00", "add", "K1500", SHJ, 5, "audit", "Recount corrected negative balance", "approved"),
  row("ADJ-2026-016", "2026-08-18T13:45:00", "deduct", "SM-S24-256", MAIN, 3, "theft", "Sealed box missing from cage", "approved"),
  row("ADJ-2026-015", "2026-08-17T16:00:00", "deduct", "HP15-I5-8GB", JEB, 2, "damage", "Water damage in transit storage", "approved"),
  row("ADJ-2026-014", "2026-08-17T10:25:00", "add", "FC-3D-GREY", AUH, 3, "audit", "Racking recount surplus", "pending"),
  row("ADJ-2026-013", "2026-08-16T15:35:00", "deduct", "ST-HD-BLK", DXB, 4, "damage", "Broken springs, scrapped", "approved"),
  row("ADJ-2026-012", "2026-08-16T09:50:00", "add", "SD-140-OAK", SHJ, 2, "audit", "Assembly area return to stock", "approved"),
  row("ADJ-2026-011", "2026-08-15T14:20:00", "deduct", "PP-A4-80G", MAIN, 20, "expiry", "Yellowed stock cleared for recycling", "approved"),
  row("ADJ-2026-010", "2026-08-15T11:05:00", "deduct", "IP15-PRO-256", MAIN, 1, "theft", "Showroom unit missing", "pending"),
  row("ADJ-2026-009", "2026-08-14T16:55:00", "add", "DL-M24-1080", DXB, 6, "audit", "PO-2026-037 over-delivery logged", "approved"),
  row("ADJ-2026-008", "2026-08-14T10:40:00", "deduct", "CH-ERGO-BLK", AUH, 2, "damage", "Gas lifts failed QA", "approved"),
  row("ADJ-2026-007", "2026-08-13T15:15:00", "deduct", "M90-BLK", SHJ, 10, "expiry", "Packaging degraded, unsellable", "approved"),
  row("ADJ-2026-006", "2026-08-13T09:30:00", "add", "WH1000XM5", MAIN, 2, "audit", "Unrecorded demo returns", "approved"),
  row("ADJ-2026-005", "2026-08-12T14:45:00", "deduct", "K1500", DXB, 7, "damage", "Keyboards from leaking container", "approved"),
  row("ADJ-2026-004", "2026-08-12T10:10:00", "deduct", "SM-S24-256", JEB, 2, "theft", "Discrepancy vs courier manifest", "pending"),
  row("ADJ-2026-003", "2026-08-11T16:25:00", "add", "HP15-I5-8GB", MAIN, 3, "audit", "Receiving count correction", "approved"),
  row("ADJ-2026-002", "2026-08-11T11:50:00", "deduct", "PN-BLU-50", SHJ, 15, "damage", "Carton crushed in racking collapse", "approved"),
  row("ADJ-2026-001", "2026-08-10T13:05:00", "add", "SRV-LR-01", MAIN, 1, "other", "Prepaid service credits reconciled", "approved"),
];

export const ADJUSTMENT_TYPE_LABEL: Record<AdjustmentType, string> = {
  add: "Add",
  deduct: "Deduct",
};

export const ADJUSTMENT_REASON_LABEL: Record<AdjustmentReason, string> = {
  damage: "Damaged",
  theft: "Missing / Theft",
  audit: "Audit Correction",
  expiry: "Expired",
  other: "Other",
};

export const ADJUSTMENT_STATUS_LABEL: Record<AdjustmentStatus, string> = {
  approved: "Approved",
  pending: "Pending",
};

export const ADJUSTMENT_WAREHOUSES = [MAIN, DXB, AUH, SHJ, JEB];

export function getUnitPrice(sku: string): number {
  return product(sku).price;
}

/** Newest timestamp in the dataset — anchor for the date-range presets. */
export const NEWEST_ADJUSTMENT_DATE = stockAdjustments.reduce(
  (max, a) => (a.date > max ? a.date : max),
  stockAdjustments[0]?.date ?? ""
);

/** Next sequential ADJ id for locally created adjustments. */
export function nextAdjustmentId(items: StockAdjustment[]): string {
  const maxNum = items.reduce((max, a) => {
    const num = Number(a.id.split("-").pop());
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `ADJ-2026-${String(maxNum + 1).padStart(3, "0")}`;
}
