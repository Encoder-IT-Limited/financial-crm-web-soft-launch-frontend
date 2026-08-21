import { products, type ProductCategory } from "../products/mock-data";

export type BatchStatus = "active" | "expiring-soon" | "expired";

export interface Batch {
  id: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  warehouse: string;
  quantity: number;
  /** ISO date (yyyy-MM-dd). */
  mfgDate: string;
  /** ISO date (yyyy-MM-dd). */
  expDate: string;
  notes: string;
  archived: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** A batch is "Expiring Soon" within this many days of its expiry date. */
export const EXPIRING_SOON_DAYS = 30;

/** Parse a yyyy-MM-dd string as a local date (avoids UTC off-by-one). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from today until the expiry date; negative once expired. */
export function getDaysRemaining(expDate: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseLocalDate(expDate).getTime() - today.getTime()) / DAY_MS);
}

export function getBatchStatus(expDate: string, now = new Date()): BatchStatus {
  const days = getDaysRemaining(expDate, now);
  if (days < 0) return "expired";
  if (days <= EXPIRING_SOON_DAYS) return "expiring-soon";
  return "active";
}

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  active: "Active",
  "expiring-soon": "Expiring Soon",
  expired: "Expired",
};

const product = (sku: string) => {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error(`Unknown SKU in batch seed: ${sku}`);
  return found;
};

const row = (
  id: string,
  sku: string,
  warehouse: string,
  quantity: number,
  mfgDate: string,
  expDate: string,
  notes: string
): Batch => {
  const p = product(sku);
  return {
    id,
    productName: p.name,
    sku: p.sku,
    category: p.category,
    warehouse,
    quantity,
    mfgDate,
    expDate,
    notes,
    archived: false,
  };
};

const MAIN = "Main Warehouse";
const DXB = "Dubai Warehouse";
const AUH = "Abu Dhabi Warehouse";
const SHJ = "Sharjah Warehouse";
const JEB = "Jebel Ali Warehouse";

/** Mock batches — swap for the inventory API response later. Expiry dates are
 * spread around Aug 2026 so all three statuses are represented. */
export const batches: Batch[] = [
  row("BATCH-2026-001", "IP15-PRO-256", MAIN, 40, "2026-07-01", "2027-07-01", "Supplier lot #A117"),
  row("BATCH-2026-002", "PP-A4-80G", DXB, 120, "2025-11-10", "2026-08-05", "Received via GR-2026-008"),
  row("BATCH-2026-003", "SM-S24-256", JEB, 25, "2026-06-15", "2027-06-15", ""),
  row("BATCH-2026-004", "PN-BLU-50", SHJ, 60, "2025-09-01", "2026-09-01", "Rotate first — oldest lot"),
  row("BATCH-2026-005", "HP15-I5-8GB", AUH, 18, "2026-05-20", "2027-05-20", "Supplier lot #C204"),
  row("BATCH-2026-006", "DL-M24-1080", MAIN, 14, "2026-04-10", "2027-04-10", ""),
  row("BATCH-2026-007", "M90-BLK", DXB, 200, "2025-08-15", "2026-08-15", "Flagged in ADJ-2026-021 stocktake"),
  row("BATCH-2026-008", "K1500", MAIN, 35, "2026-03-01", "2027-03-01", ""),
  row("BATCH-2026-009", "WH1000XM5", AUH, 9, "2026-07-22", "2026-09-12", "Demo units excluded"),
  row("BATCH-2026-010", "CH-ERGO-BLK", SHJ, 22, "2026-02-14", "2028-02-14", ""),
  row("BATCH-2026-011", "SD-140-OAK", DXB, 8, "2026-01-30", "2028-01-30", "Oak finish lot"),
  row("BATCH-2026-012", "FC-3D-GREY", MAIN, 30, "2025-10-05", "2026-08-30", "Discontinued colour"),
  row("BATCH-2026-013", "PP-A4-80G", MAIN, 90, "2026-01-12", "2026-09-18", "Received via GR-2026-023"),
  row("BATCH-2026-014", "PN-BLU-50", JEB, 45, "2025-08-20", "2026-08-25", "Promote before expiry"),
  row("BATCH-2026-015", "ST-HD-BLK", AUH, 27, "2026-06-01", "2028-06-01", ""),
  row("BATCH-2026-016", "SRV-LR-01", MAIN, 999, "2026-08-01", "2027-08-01", "Service credits — no physical stock"),
  row("BATCH-2026-017", "IP15-PRO-256", DXB, 15, "2026-08-05", "2027-08-05", "Received via GR-2026-024"),
  row("BATCH-2026-018", "SM-S24-256", MAIN, 30, "2026-07-10", "2026-09-05", ""),
  row("BATCH-2026-019", "HP15-I5-8GB", SHJ, 12, "2026-04-18", "2027-04-18", ""),
  row("BATCH-2026-020", "DL-M24-1080", JEB, 20, "2026-05-05", "2027-05-05", "Supplier lot #D311"),
  row("BATCH-2026-021", "WH1000XM5", DXB, 6, "2026-03-15", "2027-03-15", ""),
  row("BATCH-2026-022", "CH-ERGO-BLK", MAIN, 10, "2026-06-20", "2028-06-20", ""),
  row("BATCH-2026-023", "PP-A4-80G", SHJ, 75, "2025-07-15", "2026-07-20", "Write-off pending approval"),
  row("BATCH-2026-024", "K1500", AUH, 16, "2026-02-25", "2027-02-25", ""),
  row("BATCH-2026-025", "M90-BLK", SHJ, 50, "2026-07-28", "2026-09-19", ""),
  row("BATCH-2026-026", "FC-3D-GREY", DXB, 12, "2025-09-10", "2026-08-10", "Damaged racking incident ADJ-2026-002"),
];

export const BATCH_WAREHOUSES = [MAIN, DXB, AUH, SHJ, JEB];

/** Next sequential BATCH id for locally created batches. */
export function nextBatchId(items: Batch[]): string {
  const maxNum = items.reduce((max, b) => {
    const num = Number(b.id.split("-").pop());
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `BATCH-2026-${String(maxNum + 1).padStart(3, "0")}`;
}
