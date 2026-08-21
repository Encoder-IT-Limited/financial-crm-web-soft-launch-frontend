import { products, type ProductCategory } from "../products/mock-data";

export type ValuationMethod = "fifo" | "wac";

export type ValuationRange = "all" | "30" | "90" | "180";

export const VALUATION_METHOD_LABEL: Record<ValuationMethod, string> = {
  fifo: "FIFO",
  wac: "Weighted Average",
};

export const VALUATION_WAREHOUSES = [
  "Main Warehouse",
  "Dubai Warehouse",
  "Jebel Ali Warehouse",
  "Abu Dhabi Warehouse",
  "Sharjah Warehouse",
] as const;

export const VALUATION_RANGE_OPTIONS: Array<{ value: ValuationRange; label: string }> = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
];

export const CATEGORY_VALUE_COLORS: Record<ProductCategory, string> = {
  Laptops: "var(--color-blue)",
  Accessories: "var(--color-purple)",
  Furniture: "var(--color-amber)",
  Office: "var(--color-green)",
  Services: "var(--color-red)",
};

export const WAREHOUSE_VALUE_COLORS: Record<string, string> = {
  "Main Warehouse": "var(--color-blue)",
  "Dubai Warehouse": "var(--color-green)",
  "Jebel Ali Warehouse": "var(--color-amber)",
  "Abu Dhabi Warehouse": "var(--color-purple)",
  "Sharjah Warehouse": "var(--color-red)",
};

export interface ValuationRow {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  warehouse: string;
  qty: number;
  unitCostFifo: number;
  unitCostWac: number;
  unitRetail: number;
  /** ISO date (yyyy-MM-dd) of the latest stock movement behind this line. */
  asOf: string;
}

const product = (sku: string) => {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error(`Unknown SKU in valuation seed: ${sku}`);
  return found;
};

type Seed = [
  sku: string,
  warehouse: string,
  qty: number,
  unitCostFifo: number,
  unitCostWac: number,
  unitRetail: number,
  asOf: string,
];

let seq = 0;

const row = (seed: Seed): ValuationRow => {
  const [sku, warehouse, qty, unitCostFifo, unitCostWac, unitRetail, asOf] = seed;
  const p = product(sku);
  seq += 1;
  return {
    id: `val-${String(seq).padStart(3, "0")}`,
    name: p.name,
    sku,
    category: p.category,
    warehouse,
    qty,
    unitCostFifo,
    unitCostWac,
    unitRetail,
    asOf,
  };
};

/** Mock stock-position lines — replace with the inventory valuation API later. */
export const valuationRows: ValuationRow[] = (
  [
    ["IP15-PRO-256", "Main Warehouse", 74, 3555, 3582, 4299, "2026-08-18"],
    ["IP15-PRO-256", "Dubai Warehouse", 46, 3610, 3628, 4399, "2026-08-05"],
    ["SM-S24-256", "Main Warehouse", 40, 2748, 2766, 3399, "2026-08-12"],
    ["SM-S24-256", "Sharjah Warehouse", 24, 2792, 2810, 3449, "2026-07-28"],
    ["HP15-I5-8GB", "Main Warehouse", 27, 2372, 2389, 2899, "2026-08-15"],
    ["HP15-I5-8GB", "Dubai Warehouse", 15, 2418, 2404, 2949, "2026-07-10"],
    ["DL-M24-1080", "Jebel Ali Warehouse", 18, 612, 621, 749, "2026-06-02"],
    ["DL-M24-1080", "Abu Dhabi Warehouse", 26, 624, 630, 779, "2026-08-09"],
    ["M90-BLK", "Dubai Warehouse", 210, 31.4, 32.1, 45, "2026-05-30"],
    ["M90-BLK", "Main Warehouse", 130, 30.8, 31.5, 45, "2026-07-03"],
    ["K1500", "Sharjah Warehouse", 96, 67.5, 68.9, 95, "2026-04-21"],
    ["WH1000XM5", "Main Warehouse", 32, 1148, 1162, 1499, "2026-08-19"],
    ["WH1000XM5", "Jebel Ali Warehouse", 14, 1185, 1174, 1559, "2026-06-18"],
    ["CH-ERGO-BLK", "Dubai Warehouse", 52, 888, 903, 1250, "2026-05-11"],
    ["CH-ERGO-BLK", "Main Warehouse", 34, 906, 911, 1289, "2026-03-19"],
    ["SD-140-OAK", "Jebel Ali Warehouse", 24, 1618, 1637, 2150, "2026-07-21"],
    ["SD-140-OAK", "Main Warehouse", 12, 1659, 1646, 2249, "2026-02-10"],
    ["FC-3D-GREY", "Abu Dhabi Warehouse", 61, 642, 655, 850, "2026-06-25"],
    ["PP-A4-80G", "Main Warehouse", 520, 14.4, 14.7, 22, "2026-08-01"],
    ["PP-A4-80G", "Dubai Warehouse", 310, 14.9, 15.1, 22, "2026-04-08"],
    ["PN-BLU-50", "Sharjah Warehouse", 205, 23.8, 24.4, 35, "2026-05-27"],
    ["PN-BLU-50", "Main Warehouse", 145, 24.3, 24.9, 35, "2026-07-16"],
    ["ST-HD-BLK", "Dubai Warehouse", 88, 45.6, 46.7, 65, "2026-03-05"],
    ["ST-HD-BLK", "Jebel Ali Warehouse", 37, 46.9, 46.2, 65, "2026-06-09"],
  ] satisfies Seed[]
).map(row);

export function unitCostAt(line: ValuationRow, method: ValuationMethod): number {
  return method === "fifo" ? line.unitCostFifo : line.unitCostWac;
}

export function valuationCategories(rows: ValuationRow[]): ProductCategory[] {
  const present = new Set(rows.map((r) => r.category));
  return [...present].sort(
    (a, b) => PRODUCT_CATEGORY_ORDER.indexOf(a) - PRODUCT_CATEGORY_ORDER.indexOf(b)
  );
}

export function valuationWarehouses(rows: ValuationRow[]): string[] {
  const present = new Set(rows.map((r) => r.warehouse));
  return VALUATION_WAREHOUSES.filter((warehouse) => present.has(warehouse)).map(String);
}

const PRODUCT_CATEGORY_ORDER: readonly ProductCategory[] = [
  "Laptops",
  "Accessories",
  "Furniture",
  "Office",
  "Services",
];

export interface ValuationTrendPoint {
  month: string;
  value: number;
}

export const valuationTrend: ValuationTrendPoint[] = [
  { month: "Mar", value: 1015000 },
  { month: "Apr", value: 1078000 },
  { month: "May", value: 1052000 },
  { month: "Jun", value: 1136000 },
  { month: "Jul", value: 1218000 },
  { month: "Aug", value: 1294000 },
];

export function formatCompactAed(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `AED ${(value / 1_000).toFixed(1)}K`;
  return `AED ${Math.round(value).toLocaleString("en-US")}`;
}

export function formatAxisAed(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}
