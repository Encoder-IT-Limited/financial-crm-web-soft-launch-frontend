import type {
  Batch,
  Product,
  StockLevel,
  StockMovement,
  Transfer,
  Warehouse,
} from "../types";

/** ISO date `daysFromNow` days from today (local midnight). */
export function day(daysFromNow: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export const seedWarehouses: Warehouse[] = [
  {
    id: "wh-main",
    code: "MAIN-01",
    name: "Mussafah Central Warehouse",
    location: "Mussafah, Abu Dhabi",
    status: "active",
    capacityUnits: 50000,
    isPOSLinked: false,
  },
  {
    id: "wh-jafza",
    code: "JAFZA-02",
    name: "Jebel Ali Bonded Warehouse",
    location: "Jebel Ali Free Zone, Dubai",
    status: "active",
    capacityUnits: 80000,
    isPOSLinked: false,
  },
  {
    id: "wh-retail",
    code: "RET-01",
    name: "City Centre Retail Store",
    location: "City Centre, Dubai",
    status: "active",
    capacityUnits: 12000,
    isPOSLinked: false,
  },
  {
    id: "wh-pos",
    code: "POS-01",
    name: "Dubai Mall POS Counter",
    location: "Dubai Mall, Dubai",
    status: "active",
    capacityUnits: 1000,
    isPOSLinked: true,
  },
];

type LevelSpec = [warehouseId: string, available: number, reserved: number, inTransit: number, damaged: number, avgCost: number, reorder: number, reorderQty: number];

function product(
  id: string,
  sku: string,
  barcode: string,
  name: string,
  category: string,
  unit: string,
  costPrice: number,
  sellingPrice: number,
  status: Product["status"],
  levels: LevelSpec[],
  extra?: Partial<Product>
): { product: Product; levels: StockLevel[] } {
  const reorderLevels: Record<string, number> = {};
  const reorderQuantities: Record<string, number> = {};
  const stockLevels: StockLevel[] = levels.map(([warehouseId, quantity, reserved, inTransit, damaged, averageCost, reorder, reorderQuantity]) => {
    reorderLevels[warehouseId] = reorder;
    reorderQuantities[warehouseId] = reorderQuantity;
    return { productId: id, warehouseId, quantity, reserved, inTransit, damaged, averageCost };
  });
  const globalReorder = levels[0] ? reorderLevels[levels[0][0]] : 10;
  return {
    product: {
      id,
      sku,
      barcode,
      name,
      category,
      unit,
      costPrice,
      sellingPrice,
      taxRate: 5,
      reorderLevel: globalReorder,
      reorderLevels,
      reorderQuantities,
      trackBatch: false,
      trackExpiry: false,
      status,
      images: [],
      createdAt: day(-60),
      ...extra,
    },
    levels: stockLevels,
  };
}

const built: ReturnType<typeof product>[] = [
  product("prd-sleeve", "SKU-0001", "6291000000011", "Laptop Sleeve 13-inch", "Electronics", "pcs", 42, 59, "active", [
    ["wh-main", 240, 5, 0, 0, 43.25, 80, 120],
    ["wh-jafza", 40, 0, 60, 0, 42.1, 40, 60],
    ["wh-retail", 12, 0, 0, 0, 44, 15, 30],
    ["wh-pos", 14, 0, 0, 0, 44.5, 10, 12],
  ]),
  product("prd-charger", "SKU-0002", "6291000000028", "USB-C Fast Charger 65W", "Electronics", "pcs", 65, 89, "active", [
    ["wh-main", 320, 10, 0, 4, 66.4, 100, 200],
    ["wh-jafza", 85, 0, 0, 0, 65.8, 50, 100],
    ["wh-retail", 22, 0, 0, 0, 67, 15, 30],
    ["wh-pos", 0, 0, 0, 0, 66, 6, 12],
  ]),
  product("prd-keyboard", "SKU-0003", "6291000000035", "Wireless Keyboard Arabic Layout", "Electronics", "pcs", 78, 105, "active", [
    ["wh-main", 150, 0, 0, 0, 79, 40, 80],
    ["wh-jafza", 60, 0, 0, 0, 78.5, 30, 60],
    ["wh-retail", 8, 0, 0, 0, 80, 12, 20],
    ["wh-pos", 0, 0, 0, 0, 79, 5, 10],
  ]),
  product("prd-notepad", "SKU-0004", "6291000000042", "A5 Notepad Lined (pack of 5)", "Office & Stationery", "box", 9.5, 14.9, "active", [
    ["wh-main", 18, 0, 0, 0, 9.8, 50, 100],
    ["wh-retail", 6, 0, 0, 0, 10, 20, 40],
  ]),
  product("prd-pen", "SKU-0005", "6291000000059", "Gel Pen Blue 0.5mm (pack of 12)", "Office & Stationery", "box", 6, 9.5, "active", [
    ["wh-main", 400, 20, 0, 10, 6.2, 100, 200],
    ["wh-jafza", 120, 0, 0, 0, 6.1, 60, 120],
    ["wh-retail", 45, 0, 0, 0, 6.3, 30, 60],
  ]),
  product("prd-water", "SKU-0006", "6291000000066", "Mineral Water 500ml (24-pack)", "Food & Beverage", "carton", 8.5, 13.5, "active", [
    ["wh-main", 180, 0, 0, 0, 8.6, 60, 120],
    ["wh-jafza", 120, 0, 0, 0, 8.55, 60, 120],
    ["wh-retail", 35, 0, 0, 5, 8.7, 30, 60],
    ["wh-pos", 10, 0, 0, 0, 8.8, 12, 24],
  ], { trackBatch: true, trackExpiry: true }),
  product("prd-juice", "SKU-0007", "6291000000073", "Fresh Orange Juice 1L (12-pack)", "Food & Beverage", "carton", 21, 32, "active", [
    ["wh-main", 48, 0, 0, 0, 21.4, 20, 40],
    ["wh-retail", 24, 0, 0, 0, 21.5, 15, 30],
  ], { trackExpiry: true }),
  product("prd-carton", "SKU-0008", "6291000000080", "Shipping Carton 40x30x30cm", "Packaging", "pcs", 1.8, 3.2, "active", [
    ["wh-main", -8, 0, 0, 0, 1.9, 100, 200],
    ["wh-jafza", 240, 0, 0, 0, 1.85, 100, 200],
  ]),
  product("prd-tape", "SKU-0009", "6291000000097", "Packaging Tape 48mm x 100m", "Packaging", "pcs", 3.5, 5.9, "active", [
    ["wh-main", 0, 0, 0, 0, 3.6, 40, 80],
    ["wh-jafza", 10, 0, 0, 0, 3.55, 30, 60],
  ]),
  product("prd-lamp", "SKU-0010", "6291000000103", "LED Desk Lamp", "Household", "pcs", 82, 119, "discontinued", [
    ["wh-main", 14, 0, 0, 0, 83, 0, 0],
  ], { reorderLevel: 0 }),
];

export const seedProducts: Product[] = built.map((b) => b.product);
export const seedStockLevels: StockLevel[] = built.flatMap((b) => b.levels);

export const seedBatches: Batch[] = [
  {
    id: "b-wtr-exp",
    productId: "prd-water",
    warehouseId: "wh-retail",
    batchNumber: "B-2026-0421",
    manufactureDate: day(-70),
    expiryDate: day(-25),
    quantity: 30,
    quarantineQuantity: 0,
    receiptRef: "GR-000012",
    createdAt: day(-60),
  },
  {
    id: "b-wtr-main-1",
    productId: "prd-water",
    warehouseId: "wh-main",
    batchNumber: "B-2026-0902",
    manufactureDate: day(-30),
    expiryDate: day(12),
    quantity: 60,
    quarantineQuantity: 0,
    receiptRef: "GR-000014",
    createdAt: day(-20),
  },
  {
    id: "b-wtr-main-2",
    productId: "prd-water",
    warehouseId: "wh-main",
    batchNumber: "B-2026-1120",
    manufactureDate: day(-80),
    expiryDate: day(91),
    quantity: 120,
    quarantineQuantity: 0,
    receiptRef: "GR-000009",
    createdAt: day(-75),
  },
  {
    id: "b-wtr-jafza",
    productId: "prd-water",
    warehouseId: "wh-jafza",
    batchNumber: "B-2026-1210",
    manufactureDate: day(-85),
    expiryDate: day(110),
    quantity: 120,
    quarantineQuantity: 0,
    receiptRef: "GR-000008",
    createdAt: day(-80),
  },
  {
    id: "b-juc-main",
    productId: "prd-juice",
    warehouseId: "wh-main",
    batchNumber: "B-2026-1015",
    manufactureDate: day(-45),
    expiryDate: day(55),
    quantity: 48,
    quarantineQuantity: 0,
    receiptRef: "GR-000013",
    createdAt: day(-40),
  },
  {
    id: "b-juc-retail",
    productId: "prd-juice",
    warehouseId: "wh-retail",
    batchNumber: "B-2026-1018",
    manufactureDate: day(-42),
    expiryDate: day(58),
    quantity: 24,
    quarantineQuantity: 0,
    receiptRef: "GR-000013",
    createdAt: day(-38),
  },
];

export const seedTransfers: Transfer[] = [
  {
    id: "trf-1",
    number: "TRF-0001",
    fromWarehouseId: "wh-jafza",
    toWarehouseId: "wh-main",
    requestedBy: "Salma H.",
    requestedAt: day(-2),
    status: "dispatched",
    items: [{ id: "trfi-1", productId: "prd-sleeve", quantity: 60, batchId: null }],
    dispatchedAt: day(-1),
    notes: "Bulk restock for Mussafah picking zone",
  },
  {
    id: "trf-2",
    number: "TRF-0002",
    fromWarehouseId: "wh-main",
    toWarehouseId: "wh-retail",
    requestedBy: "Salma H.",
    requestedAt: day(0),
    status: "requested",
    items: [{ id: "trfi-2", productId: "prd-keyboard", quantity: 24, batchId: null }],
    notes: "Retail floor replenishment",
  },
];

let mvId = 0;
function movement(
  type: StockMovement["type"],
  productId: string,
  warehouseId: string,
  quantity: number,
  refType: StockMovement["refType"],
  refNumber: string,
  at: string
): StockMovement {
  mvId += 1;
  return {
    id: `mv-${mvId}`,
    at,
    type,
    productId,
    warehouseId,
    batchId: null,
    quantity,
    refType,
    refNumber,
    createdBy: "Salma H.",
  };
}

export const seedMovements: StockMovement[] = [
  ...seedStockLevels.map((l) => movement("opening", l.productId, l.warehouseId, l.quantity, "adjustment", "OPENING", day(-45))),
  movement("transfer-out", "prd-sleeve", "wh-jafza", -60, "transfer", "TRF-0001", day(-1)),
  movement("transfer-dispatch", "prd-sleeve", "wh-main", 60, "transfer", "TRF-0001", day(-1)),
  movement("damaged", "prd-water", "wh-retail", -5, "adjustment", "ADJ-0001", day(-3)),
  movement("damaged", "prd-pen", "wh-main", -10, "adjustment", "ADJ-0001", day(-3)),
  movement("sale", "prd-sleeve", "wh-pos", -6, "pos", "POS-000213", day(0)),
];

export const seedProductSeq = 11; // next SKU-0011
export const seedTransferSeq = 3; // next TRF-0003
export const seedAdjustmentSeq = 2; // next ADJ-0002