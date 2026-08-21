import { products, type ProductCategory } from "../products/mock-data";

export type TransferStatus = "pending" | "in-transit" | "completed" | "cancelled";

export interface StockTransfer {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  /** ISO datetime. */
  transferDate: string;
  /** ISO date (yyyy-MM-dd). */
  expectedDelivery: string;
  status: TransferStatus;
}

const product = (sku: string) => {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error(`Unknown SKU in stock transfer seed: ${sku}`);
  return found;
};

const row = (
  id: string,
  sku: string,
  quantity: number,
  unit: string,
  fromWarehouse: string,
  toWarehouse: string,
  transferDate: string,
  expectedDelivery: string,
  status: TransferStatus
): StockTransfer => {
  const p = product(sku);
  return {
    id,
    fromWarehouse,
    toWarehouse,
    productName: p.name,
    sku: p.sku,
    category: p.category,
    quantity,
    unit,
    transferDate,
    expectedDelivery,
    status,
  };
};

const MAIN = "Main Warehouse";
const DXB = "Dubai Warehouse";
const AUH = "Abu Dhabi Warehouse";
const SHJ = "Sharjah Warehouse";
const JEB = "Jebel Ali Warehouse";

/** Mock transfers — swap for the inventory API response later.
 * Dates are relative to the newest entry so the range presets stay meaningful. */
export const stockTransfers: StockTransfer[] = [
  row("TRF-2026-022", "IP15-PRO-256", 40, "pcs", MAIN, JEB, "2026-08-21T09:30:00", "2026-08-23", "in-transit"),
  row("TRF-2026-021", "PP-A4-80G", 25, "boxes", MAIN, DXB, "2026-08-20T15:10:00", "2026-08-22", "pending"),
  row("TRF-2026-020", "M90-BLK", 60, "pcs", DXB, SHJ, "2026-08-20T11:45:00", "2026-08-21", "completed"),
  row("TRF-2026-019", "CH-ERGO-BLK", 8, "pcs", MAIN, AUH, "2026-08-19T16:20:00", "2026-08-22", "in-transit"),
  row("TRF-2026-018", "K1500", 30, "pcs", MAIN, DXB, "2026-08-19T10:05:00", "2026-08-20", "cancelled"),
  row("TRF-2026-017", "HP15-I5-8GB", 25, "pcs", MAIN, JEB, "2026-08-18T14:40:00", "2026-08-21", "pending"),
  row("TRF-2026-016", "PN-BLU-50", 20, "boxes", MAIN, SHJ, "2026-08-18T09:15:00", "2026-08-19", "completed"),
  row("TRF-2026-015", "SD-140-OAK", 5, "pcs", DXB, AUH, "2026-08-17T13:50:00", "2026-08-24", "in-transit"),
  row("TRF-2026-014", "PP-A4-80G", 30, "boxes", MAIN, DXB, "2026-08-17T08:30:00", "2026-08-18", "completed"),
  row("TRF-2026-013", "WH1000XM5", 6, "pcs", MAIN, AUH, "2026-08-16T17:05:00", "2026-08-18", "completed"),
  row("TRF-2026-012", "DL-M24-1080", 12, "pcs", MAIN, JEB, "2026-08-16T12:25:00", "2026-08-19", "pending"),
  row("TRF-2026-011", "ST-HD-BLK", 15, "pcs", AUH, SHJ, "2026-08-15T15:55:00", "2026-08-17", "cancelled"),
  row("TRF-2026-010", "SM-S24-256", 20, "pcs", MAIN, DXB, "2026-08-15T10:40:00", "2026-08-16", "completed"),
  row("TRF-2026-009", "FC-3D-GREY", 4, "pcs", MAIN, AUH, "2026-08-14T16:35:00", "2026-08-20", "in-transit"),
  row("TRF-2026-008", "SRV-LR-01", 2, "units", MAIN, JEB, "2026-08-14T09:00:00", "2026-08-25", "pending"),
  row("TRF-2026-007", "M90-BLK", 45, "pcs", MAIN, SHJ, "2026-08-13T14:20:00", "2026-08-14", "completed"),
  row("TRF-2026-006", "IP15-PRO-256", 15, "pcs", DXB, AUH, "2026-08-12T11:10:00", "2026-08-14", "completed"),
  row("TRF-2026-005", "K1500", 35, "pcs", MAIN, JEB, "2026-08-11T15:45:00", "2026-08-13", "cancelled"),
  row("TRF-2026-004", "CH-ERGO-BLK", 10, "pcs", MAIN, DXB, "2026-08-10T10:20:00", "2026-08-12", "completed"),
  row("TRF-2026-003", "PN-BLU-50", 18, "boxes", SHJ, AUH, "2026-08-07T13:05:00", "2026-08-09", "completed"),
  row("TRF-2026-002", "DL-M24-1080", 9, "pcs", MAIN, SHJ, "2026-08-06T09:50:00", "2026-08-08", "completed"),
  row("TRF-2026-001", "PP-A4-80G", 40, "boxes", MAIN, DXB, "2026-08-05T14:15:00", "2026-08-07", "completed"),
];

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  pending: "Pending",
  "in-transit": "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TRANSFER_WAREHOUSES = [MAIN, DXB, AUH, SHJ, JEB];

export function getUnitPrice(sku: string): number {
  return product(sku).price;
}

/** Newest timestamp in the dataset — anchor for the date-range presets. */
export const NEWEST_TRANSFER_DATE = stockTransfers.reduce(
  (max, t) => (t.transferDate > max ? t.transferDate : max),
  stockTransfers[0]?.transferDate ?? ""
);

/** Next sequential TRF id for locally created transfers. */
export function nextTransferId(items: StockTransfer[]): string {
  const maxNum = items.reduce((max, t) => {
    const num = Number(t.id.split("-").pop());
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `TRF-2026-${String(maxNum + 1).padStart(3, "0")}`;
}
