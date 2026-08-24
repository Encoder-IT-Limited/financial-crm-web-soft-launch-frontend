import { products } from "../products/mock-data";

export type ReceiptStatus = "pending" | "partially-received" | "completed" | "overdue";

export interface ReceiptLine {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  expectedQty: number;
  receivedQty: number;
}

export interface GoodsReceipt {
  id: string;
  poNumber: string;
  supplier: string;
  supplierContact: string;
  warehouse: string;
  expectedItems: number;
  receivedItems: number;
  /** ISO datetime of the receipt; null while nothing has been received yet. */
  receiptDate: string | null;
  /** ISO date (yyyy-MM-dd) the delivery was due. */
  expectedDate: string;
  status: ReceiptStatus;
  lines: ReceiptLine[];
}

export interface PurchaseOrderLine {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
}

export interface OpenPurchaseOrder {
  poNumber: string;
  supplier: string;
  supplierContact: string;
  warehouse: string;
  /** ISO date (yyyy-MM-dd). */
  expectedDate: string;
  lines: PurchaseOrderLine[];
}

/** Line-level payload submitted by the Record Receipt dialog. */
export interface ReceiptSubmissionLine extends PurchaseOrderLine {
  /** Quantity being received in this submission. */
  receivedNow: number;
  expiryDate: string;
}

export interface ReceiptSubmission {
  poNumber: string;
  supplier: string;
  supplierContact: string;
  warehouse: string;
  expectedDate: string;
  lines: ReceiptSubmissionLine[];
  notes: string;
}

const product = (sku: string) => {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error(`Unknown SKU in goods receipt seed: ${sku}`);
  return found;
};

type SeedLine = [sku: string, expectedQty: number, receivedQty: number, unit?: string];

const row = (
  id: string,
  poNumber: string,
  supplier: string,
  supplierContact: string,
  warehouse: string,
  seedLines: SeedLine[],
  receiptDate: string | null,
  expectedDate: string,
  status: ReceiptStatus
): GoodsReceipt => ({
  id,
  poNumber,
  supplier,
  supplierContact,
  warehouse,
  expectedItems: seedLines.reduce((sum, [, expected]) => sum + expected, 0),
  receivedItems: seedLines.reduce((sum, [, , received]) => sum + received, 0),
  receiptDate,
  expectedDate,
  status,
  lines: seedLines.map(([sku, expectedQty, receivedQty, unit]) => {
    const p = product(sku);
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      unit: unit ?? "pcs",
      expectedQty,
      receivedQty,
    };
  }),
});

const GULF = ["Gulf Tech Trading", "+971 4 555 0132"] as const;
const EOS = ["Emirates Office Supplies", "sales@emiratesoffice.ae"] as const;
const ALAIN = ["Al Ain Electronics", "+971 2 555 7788"] as const;
const SHJ_FURN = ["Sharjah Furniture Co.", "orders@shjfurniture.ae"] as const;
const DXB_DIGI = ["Dubai Digital Devices", "+971 4 555 9021"] as const;

const MAIN = "Main Warehouse";
const DXB = "Dubai Warehouse";
const AUH = "Abu Dhabi Warehouse";
const SHJ = "Sharjah Warehouse";
const JEB = "Jebel Ali Warehouse";

/** Mock receipts — swap for the inventory API response later.
 * Dates are anchored around Aug 2026 so the summary cards and range presets stay meaningful. */
export const goodsReceipts: GoodsReceipt[] = [
  row("GR-2026-024", "PO-2026-039", ...GULF, MAIN, [["IP15-PRO-256", 30, 30]], "2026-08-21T09:05:00", "2026-08-21", "completed"),
  row("GR-2026-023", "PO-2026-038", ...EOS, DXB, [["PP-A4-80G", 60, 60, "boxes"], ["PN-BLU-50", 25, 25, "boxes"]], "2026-08-21T08:20:00", "2026-08-20", "completed"),
  row("GR-2026-022", "PO-2026-037", ...ALAIN, AUH, [["DL-M24-1080", 10, 6]], "2026-08-20T16:45:00", "2026-08-19", "partially-received"),
  row("GR-2026-021", "PO-2026-036", ...DXB_DIGI, JEB, [["SM-S24-256", 25, 25]], "2026-08-20T11:30:00", "2026-08-18", "completed"),
  row("GR-2026-020", "PO-2026-035", ...SHJ_FURN, SHJ, [["CH-ERGO-BLK", 12, 0]], null, "2026-08-19", "overdue"),
  row("GR-2026-019", "PO-2026-034", ...GULF, MAIN, [["WH1000XM5", 8, 8]], "2026-08-20T09:10:00", "2026-08-17", "completed"),
  row("GR-2026-018", "PO-2026-033", ...EOS, MAIN, [["PP-A4-80G", 80, 45, "boxes"]], "2026-08-19T14:00:00", "2026-08-18", "partially-received"),
  row("GR-2026-017", "PO-2026-032", ...ALAIN, DXB, [["HP15-I5-8GB", 20, 20]], "2026-08-19T10:25:00", "2026-08-16", "completed"),
  row("GR-2026-016", "PO-2026-031", ...DXB_DIGI, MAIN, [["M90-BLK", 100, 100], ["K1500", 40, 40]], "2026-08-18T15:40:00", "2026-08-15", "completed"),
  row("GR-2026-015", "PO-2026-030", ...SHJ_FURN, AUH, [["SD-140-OAK", 6, 6]], "2026-08-18T09:55:00", "2026-08-14", "completed"),
  row("GR-2026-014", "PO-2026-029", ...GULF, JEB, [["IP15-PRO-256", 20, 12]], "2026-08-17T13:15:00", "2026-08-14", "partially-received"),
  row("GR-2026-013", "PO-2026-028", ...EOS, SHJ, [["PN-BLU-50", 30, 30, "boxes"], ["ST-HD-BLK", 15, 15]], "2026-08-17T08:45:00", "2026-08-13", "completed"),
  row("GR-2026-012", "PO-2026-027", ...ALAIN, MAIN, [["DL-M24-1080", 15, 0]], null, "2026-08-13", "overdue"),
  row("GR-2026-011", "PO-2026-026", ...DXB_DIGI, DXB, [["SM-S24-256", 30, 30]], "2026-08-16T17:20:00", "2026-08-12", "completed"),
  row("GR-2026-010", "PO-2026-025", ...SHJ_FURN, MAIN, [["FC-3D-GREY", 10, 10]], "2026-08-16T10:05:00", "2026-08-11", "completed"),
  row("GR-2026-009", "PO-2026-024", ...GULF, AUH, [["WH1000XM5", 12, 7]], "2026-08-15T12:50:00", "2026-08-12", "partially-received"),
  row("GR-2026-008", "PO-2026-023", ...EOS, JEB, [["PP-A4-80G", 120, 120, "boxes"]], "2026-08-15T09:30:00", "2026-08-10", "completed"),
  row("GR-2026-007", "PO-2026-022", ...ALAIN, MAIN, [["HP15-I5-8GB", 15, 0]], null, "2026-08-15", "pending"),
  row("GR-2026-006", "PO-2026-021", ...DXB_DIGI, SHJ, [["M90-BLK", 60, 60], ["K1500", 25, 25]], "2026-08-14T16:10:00", "2026-08-09", "completed"),
  row("GR-2026-005", "PO-2026-020", ...SHJ_FURN, DXB, [["CH-ERGO-BLK", 8, 8], ["SD-140-OAK", 4, 4]], "2026-08-14T11:35:00", "2026-08-08", "completed"),
  row("GR-2026-004", "PO-2026-019", ...GULF, MAIN, [["IP15-PRO-256", 15, 0]], null, "2026-08-22", "pending"),
  row("GR-2026-003", "PO-2026-018", ...EOS, AUH, [["PP-A4-80G", 50, 50, "boxes"], ["PN-BLU-50", 20, 20, "boxes"]], "2026-08-13T14:25:00", "2026-08-07", "completed"),
  row("GR-2026-002", "PO-2026-017", ...ALAIN, JEB, [["DL-M24-1080", 12, 9]], "2026-08-12T15:55:00", "2026-08-06", "partially-received"),
  row("GR-2026-001", "PO-2026-016", ...DXB_DIGI, MAIN, [["SM-S24-256", 18, 18]], "2026-08-12T09:40:00", "2026-08-05", "completed"),
];

/** Mock open purchase orders awaiting receipts — swap for the purchasing API later. */
export const openPurchaseOrders: OpenPurchaseOrder[] = [
  {
    poNumber: "PO-2026-041",
    supplier: GULF[0],
    supplierContact: GULF[1],
    warehouse: MAIN,
    expectedDate: "2026-08-24",
    lines: [
      { productId: product("IP15-PRO-256").id, sku: "IP15-PRO-256", name: product("IP15-PRO-256").name, unit: "pcs", orderedQty: 40, receivedQty: 0 },
      { productId: product("SM-S24-256").id, sku: "SM-S24-256", name: product("SM-S24-256").name, unit: "pcs", orderedQty: 20, receivedQty: 0 },
    ],
  },
  {
    poNumber: "PO-2026-042",
    supplier: EOS[0],
    supplierContact: EOS[1],
    warehouse: DXB,
    expectedDate: "2026-08-23",
    lines: [
      { productId: product("PP-A4-80G").id, sku: "PP-A4-80G", name: product("PP-A4-80G").name, unit: "boxes", orderedQty: 100, receivedQty: 40 },
      { productId: product("PN-BLU-50").id, sku: "PN-BLU-50", name: product("PN-BLU-50").name, unit: "boxes", orderedQty: 50, receivedQty: 50 },
    ],
  },
  {
    poNumber: "PO-2026-043",
    supplier: ALAIN[0],
    supplierContact: ALAIN[1],
    warehouse: AUH,
    expectedDate: "2026-08-26",
    lines: [
      { productId: product("WH1000XM5").id, sku: "WH1000XM5", name: product("WH1000XM5").name, unit: "pcs", orderedQty: 10, receivedQty: 0 },
      { productId: product("DL-M24-1080").id, sku: "DL-M24-1080", name: product("DL-M24-1080").name, unit: "pcs", orderedQty: 15, receivedQty: 5 },
    ],
  },
  {
    poNumber: "PO-2026-044",
    supplier: SHJ_FURN[0],
    supplierContact: SHJ_FURN[1],
    warehouse: SHJ,
    expectedDate: "2026-08-28",
    lines: [
      { productId: product("SD-140-OAK").id, sku: "SD-140-OAK", name: product("SD-140-OAK").name, unit: "pcs", orderedQty: 6, receivedQty: 0 },
    ],
  },
];

export const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  pending: "Pending",
  "partially-received": "Partially Received",
  completed: "Completed",
  overdue: "Overdue",
};

export const RECEIPT_SUPPLIERS = [GULF[0], EOS[0], ALAIN[0], SHJ_FURN[0], DXB_DIGI[0]];

export const RECEIPT_WAREHOUSES = [MAIN, DXB, AUH, SHJ, JEB];

/** Newest timestamp in the dataset — anchor for the date-range presets. */
export const NEWEST_RECEIPT_DATE = goodsReceipts.reduce(
  (max, r) => ((r.receiptDate ?? "") > max ? (r.receiptDate ?? "") : max),
  goodsReceipts[0]?.receiptDate ?? ""
);

/** Next sequential GR id for locally recorded receipts. */
export function nextReceiptId(items: GoodsReceipt[]): string {
  const maxNum = items.reduce((max, r) => {
    const num = Number(r.id.split("-").pop());
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `GR-2026-${String(maxNum + 1).padStart(3, "0")}`;
}
