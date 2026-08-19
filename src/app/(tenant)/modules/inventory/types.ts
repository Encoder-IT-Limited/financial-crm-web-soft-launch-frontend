/* ------------------------------------------------------------------ */
/* Inventory & Procurement — domain model (frontend mock of the        */
/* PostgreSQL schema in docs/inv-pos-hr-tenant.md §33. All ids are     */
/* strings; timestamps are ISO strings so the Zustand store can be     */
/* persisted to localStorage without a serializer.                     */
/* ------------------------------------------------------------------ */

export type ProductStatus = "active" | "inactive" | "discontinued";

export type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number; // % — used on invoices/POS lines
  reorderLevel: number; // default global threshold
  reorderLevels: Record<string, number>; // per-warehouse overrides
  trackBatch: boolean;
  trackExpiry: boolean;
  status: ProductStatus;
  description?: string;
  createdAt: string;
};

export type WarehouseStatus = "active" | "inactive";

export type Warehouse = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: WarehouseStatus;
  capacityUnits: number;
};

export type Batch = {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  quantity: number; // tracked breakdown; master quantity lives in StockLevel
  quarantineQuantity: number; // damaged/expired units moved aside from sellable
  receiptRef: string; // GR number, transfer number, or adjustment ref
  createdAt: string;
};

/** Master sellable balance per product+warehouse. May legitimately go
 * negative (oversell/adjustment) — that state is surfaced as the
 * "PENDING UPLOAD — Stock Confirmation Missing" flag, never blocked. */
export type StockLevel = {
  productId: string;
  warehouseId: string;
  quantity: number; // sellable on hand (negative allowed)
  reserved: number; // committed to open POs/transfers
};

export type StockStatus = "in-stock" | "low" | "out" | "negative";

/* ----------------------------- Vendors ---------------------------- */

export type Vendor = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
};

/* ------------------------- Purchase Orders ------------------------ */

export type POStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "partially-received"
  | "fully-received"
  | "closed"
  | "rejected";

export type POItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  received: number; // cumulative received across GRs
};

export type PurchaseOrder = {
  id: string;
  number: string; // PO-000001
  vendorId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate: string;
  status: POStatus;
  items: POItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  draft: "draft" | "live"; // draft POs are labeled clearly and never auto-submit
  submittedAt?: string;
  approvedAt?: string;
  createdBy: string;
};

export type GRItem = {
  id: string;
  productId: string;
  quantityReceived: number;
  unitPrice: number;
  batchId: string; // batch created/assigned at receipt time
  suggestedBatchId: string; // FEFO/FIFO suggestion at time of receipt
};

export type GoodsReceipt = {
  id: string;
  number: string; // GR-000001
  poId: string;
  warehouseId: string;
  receivedDate: string;
  items: GRItem[];
  status: "posted";
  postedAt: string;
  createdBy: string;
};

/* -------------------------- Stock Transfers ----------------------- */

export type TransferStatus =
  | "requested"
  | "approved"
  | "dispatched"
  | "received"
  | "rejected"
  | "cancelled";

export type TransferItem = {
  id: string;
  productId: string;
  quantity: number;
  batchId: string | null; // batch locked at dispatch (FEFO/FIFO suggestion)
};

export type Transfer = {
  id: string;
  number: string; // TRF-000001
  fromWarehouseId: string;
  toWarehouseId: string;
  requestedBy: string;
  requestedAt: string;
  status: TransferStatus;
  items: TransferItem[];
  approvedBy?: string;
  approvedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  receivedBy?: string;
  notes?: string;
};

/* --------------------------- Adjustments -------------------------- */

export type AdjustmentType = "add" | "remove" | "damaged" | "expired" | "opening";

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Add stock",
  remove: "Remove stock",
  damaged: "Damaged",
  expired: "Expired",
  opening: "Opening stock",
};

export type Adjustment = {
  id: string;
  number: string; // ADJ-000001
  productId: string;
  warehouseId: string;
  type: AdjustmentType;
  quantity: number; // unsigned; direction derived from type
  reasonCode: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
};

export type ReasonCode = {
  code: string;
  label: string;
  type: "add" | "remove" | "damaged" | "expired";
};

export const REASON_CODES: ReasonCode[] = [
  { code: "COUNT-FOUND", label: "Cycle count — found extra", type: "add" },
  { code: "COUNT-SHORT", label: "Cycle count — short", type: "remove" },
  { code: "RETURN-RESTOCK", label: "Customer return restock", type: "add" },
  { code: "SAMPLE-REMOVAL", label: "Sample / demo removal", type: "remove" },
  { code: "DAMAGED-IN-HANDLING", label: "Damaged in handling", type: "damaged" },
  { code: "SPOILED", label: "Spoiled in storage", type: "damaged" },
  { code: "EXPIRED-SHELF-LIFE", label: "Past shelf life", type: "expired" },
  { code: "THEFT-LOSS", label: "Theft / unexplained loss", type: "remove" },
];

/* ----------------------------- Movement --------------------------- */

export type MovementType =
  | "purchase-receipt"
  | "sale"
  | "sale-return"
  | "transfer-out"
  | "transfer-in"
  | "transfer-dispatch"
  | "adjustment"
  | "damaged"
  | "expired"
  | "opening";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  "purchase-receipt": "Purchase Receipt",
  sale: "Sale",
  "sale-return": "Sales Return",
  "transfer-out": "Transfer Out",
  "transfer-in": "Transfer In",
  "transfer-dispatch": "Dispatch",
  adjustment: "Stock Adjustment",
  damaged: "Damaged",
  expired: "Expired",
  opening: "Opening Stock",
};

export type StockMovement = {
  id: string;
  at: string;
  type: MovementType;
  productId: string;
  warehouseId: string;
  batchId: string | null;
  quantity: number; // signed: + in, − out
  refType: "po" | "gr" | "transfer" | "adjustment" | "pos" | "return";
  refNumber: string;
  createdBy: string;
};

/* ------------------------- POS + offline sync ---------------------- */

export type PaymentMethod = "cash" | "card" | "mobile";

export type PosPayload = {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    batchId: string | null;
  }[];
  subtotal: number;
  discount: number; // AED, applied before tax
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  idempotencyKey: string;
  terminal: string;
  deviceId: string;
  localSequence: number;
};

export type SyncStatus = "pending" | "failed" | "synced";

export type SyncQueueItem = {
  id: string;
  payload: PosPayload;
  occurredAt: string;
  status: SyncStatus;
  retries: number;
  error?: string;
};

export type PosReceipt = {
  id: string;
  receiptNo: string; // POS-000001 — distinct from INV-000001 invoices
  occurredAt: string;
  payload: PosPayload;
  /** online = posted straight to stock; offline = queued for sync */
  source: "online" | "offline";
  status: "posted" | "queued" | "synced";
};

export type Conflict = {
  id: string;
  productId: string;
  warehouseId: string;
  onHandAtSync: number;
  soldTotal: number;
  oversold: number;
  registers: { terminal: string; qty: number }[];
  status: "open" | "resolved";
  resolution?: "confirm-shortfall" | "adjust-stock";
  resolvedAt?: string;
};

/* ------------------------------ Misc ------------------------------ */

export type SeatPlan = {
  name: string;
  includedSeats: number;
  extraSeatPrice: number; // AED / user / month
};

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "active" | "invited";
};

export type TenantRole = {
  id: string;
  label: string;
  /** Canonical permission strings used by the mock RBAC checks */
  permissions: string[];
};

/* --------------------------- Dashboard helpers -------------------- */

export type StockSnapshot = {
  onHand: number;
  reserved: number;
  available: number;
  status: StockStatus;
};