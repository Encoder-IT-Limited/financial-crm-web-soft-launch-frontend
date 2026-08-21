import { products, type ProductCategory } from "../products/mock-data";

export type MovementKind = "inbound" | "outbound" | "adjustment" | "transfer";
export type MovementStatus = "completed" | "pending" | "cancelled";

export interface StockMovement {
  id: string;
  /** ISO datetime — used for sorting and date-range filtering. */
  datetime: string;
  kind: MovementKind;
  productName: string;
  sku: string;
  category: ProductCategory;
  sourceWarehouse: string | null;
  destinationWarehouse: string | null;
  /** Positive for inflows, negative for outflows, ± for adjustments, net-zero moves for transfers. */
  quantity: number;
  reference: string;
  status: MovementStatus;
}

const product = (sku: string) => {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error(`Unknown SKU in stock movement seed: ${sku}`);
  return { productName: found.name, sku: found.sku, category: found.category };
};

const MAIN = "Main Warehouse";
const DXB = "Dubai Warehouse";
const AUH = "Abu Dhabi Warehouse";
const SHJ = "Sharjah Warehouse";
const JEB = "Jebel Ali Warehouse";

/** Mock movements — swap for the inventory API response later.
 * Dates are relative to the newest entry so the range presets stay meaningful. */
export const stockMovements: StockMovement[] = [
  { id: "mv-101", datetime: "2026-08-21T10:30:00", kind: "inbound", ...product("IP15-PRO-256"), sourceWarehouse: null, destinationWarehouse: MAIN, quantity: 120, reference: "GRN-2026-041", status: "completed" },
  { id: "mv-102", datetime: "2026-08-21T09:15:00", kind: "outbound", ...product("SM-S24-256"), sourceWarehouse: DXB, destinationWarehouse: null, quantity: -30, reference: "SO-2026-089", status: "completed" },
  { id: "mv-103", datetime: "2026-08-20T16:45:00", kind: "transfer", ...product("HP15-I5-8GB"), sourceWarehouse: MAIN, destinationWarehouse: JEB, quantity: 25, reference: "TRF-2026-017", status: "pending" },
  { id: "mv-104", datetime: "2026-08-20T14:20:00", kind: "adjustment", ...product("M90-BLK"), sourceWarehouse: AUH, destinationWarehouse: null, quantity: -3, reference: "ADJ-2026-012", status: "completed" },
  { id: "mv-105", datetime: "2026-08-20T11:05:00", kind: "inbound", ...product("PP-A4-80G"), sourceWarehouse: null, destinationWarehouse: DXB, quantity: 60, reference: "GRN-2026-040", status: "completed" },
  { id: "mv-106", datetime: "2026-08-19T17:40:00", kind: "outbound", ...product("CH-ERGO-BLK"), sourceWarehouse: MAIN, destinationWarehouse: null, quantity: -6, reference: "SO-2026-088", status: "completed" },
  { id: "mv-107", datetime: "2026-08-19T15:10:00", kind: "transfer", ...product("PN-BLU-50"), sourceWarehouse: MAIN, destinationWarehouse: SHJ, quantity: 20, reference: "TRF-2026-016", status: "cancelled" },
  { id: "mv-108", datetime: "2026-08-19T12:00:00", kind: "inbound", ...product("FC-3D-GREY"), sourceWarehouse: null, destinationWarehouse: AUH, quantity: 15, reference: "GRN-2026-039", status: "completed" },
  { id: "mv-109", datetime: "2026-08-18T18:25:00", kind: "outbound", ...product("WH1000XM5"), sourceWarehouse: AUH, destinationWarehouse: null, quantity: -2, reference: "SO-2026-087", status: "completed" },
  { id: "mv-110", datetime: "2026-08-18T13:35:00", kind: "adjustment", ...product("K1500"), sourceWarehouse: DXB, destinationWarehouse: null, quantity: 4, reference: "ADJ-2026-011", status: "pending" },
  { id: "mv-111", datetime: "2026-08-18T09:50:00", kind: "inbound", ...product("DL-M24-1080"), sourceWarehouse: null, destinationWarehouse: MAIN, quantity: 24, reference: "GRN-2026-038", status: "completed" },
  { id: "mv-112", datetime: "2026-08-17T16:55:00", kind: "outbound", ...product("ST-HD-BLK"), sourceWarehouse: MAIN, destinationWarehouse: null, quantity: -8, reference: "SO-2026-086", status: "completed" },
  { id: "mv-113", datetime: "2026-08-17T14:00:00", kind: "transfer", ...product("SD-140-OAK"), sourceWarehouse: DXB, destinationWarehouse: AUH, quantity: 5, reference: "TRF-2026-015", status: "completed" },
  { id: "mv-114", datetime: "2026-08-17T10:20:00", kind: "inbound", ...product("M90-BLK"), sourceWarehouse: null, destinationWarehouse: DXB, quantity: 50, reference: "GRN-2026-037", status: "completed" },
  { id: "mv-115", datetime: "2026-08-16T17:30:00", kind: "outbound", ...product("IP15-PRO-256"), sourceWarehouse: MAIN, destinationWarehouse: null, quantity: -18, reference: "SO-2026-085", status: "completed" },
  { id: "mv-116", datetime: "2026-08-16T15:45:00", kind: "adjustment", ...product("SRV-LR-01"), sourceWarehouse: SHJ, destinationWarehouse: null, quantity: -2, reference: "ADJ-2026-010", status: "cancelled" },
  { id: "mv-117", datetime: "2026-08-16T11:15:00", kind: "inbound", ...product("SM-S24-256"), sourceWarehouse: null, destinationWarehouse: MAIN, quantity: 45, reference: "GRN-2026-036", status: "completed" },
  { id: "mv-118", datetime: "2026-08-15T16:10:00", kind: "transfer", ...product("PP-A4-80G"), sourceWarehouse: MAIN, destinationWarehouse: DXB, quantity: 30, reference: "TRF-2026-014", status: "completed" },
  { id: "mv-119", datetime: "2026-08-15T13:25:00", kind: "outbound", ...product("HP15-I5-8GB"), sourceWarehouse: MAIN, destinationWarehouse: null, quantity: -7, reference: "SO-2026-084", status: "pending" },
  { id: "mv-120", datetime: "2026-08-15T09:40:00", kind: "inbound", ...product("CH-ERGO-BLK"), sourceWarehouse: null, destinationWarehouse: JEB, quantity: 12, reference: "GRN-2026-035", status: "completed" },
  { id: "mv-121", datetime: "2026-08-14T17:50:00", kind: "outbound", ...product("PN-BLU-50"), sourceWarehouse: MAIN, destinationWarehouse: null, quantity: -15, reference: "SO-2026-083", status: "completed" },
  { id: "mv-122", datetime: "2026-08-14T15:05:00", kind: "adjustment", ...product("DL-M24-1080"), sourceWarehouse: MAIN, destinationWarehouse: null, quantity: -1, reference: "ADJ-2026-009", status: "completed" },
  { id: "mv-123", datetime: "2026-08-14T11:30:00", kind: "transfer", ...product("WH1000XM5"), sourceWarehouse: MAIN, destinationWarehouse: AUH, quantity: 6, reference: "TRF-2026-013", status: "completed" },
  { id: "mv-124", datetime: "2026-08-14T09:00:00", kind: "inbound", ...product("ST-HD-BLK"), sourceWarehouse: null, destinationWarehouse: MAIN, quantity: 20, reference: "GRN-2026-034", status: "completed" },
];

export const MOVEMENT_KIND_LABEL: Record<MovementKind, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  adjustment: "Adjustment",
  transfer: "Transfer",
};

export const MOVEMENT_STATUS_LABEL: Record<MovementStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
};

/** Newest timestamp in the dataset — anchor for the date-range presets so
 * mock data stays filterable no matter when it is viewed. */
export const NEWEST_MOVEMENT_DATE = stockMovements.reduce(
  (max, m) => (m.datetime > max ? m.datetime : max),
  stockMovements[0]?.datetime ?? ""
);
