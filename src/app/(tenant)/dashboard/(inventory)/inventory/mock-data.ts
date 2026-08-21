import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Package,
  PackageSearch,
  Warehouse,
} from "lucide-react";

export type Tone = "blue" | "purple" | "green" | "amber" | "red";

/** Single swap point for the future API layer — every section of the
 * dashboard renders from these structures. */

export interface KpiItem {
  id: string;
  label: string;
  value: string;
  /** Muted suffix shown next to the trend, e.g. "this week". */
  note?: string;
  trendText: string;
  trendDirection: "up" | "down";
  trendTone: "positive" | "negative";
  icon: LucideIcon;
  tone: Tone;
}

export const kpis: KpiItem[] = [
  {
    id: "total-products",
    label: "Total Products",
    value: "5,240",
    trendText: "8.2% vs last week",
    trendDirection: "up",
    trendTone: "positive",
    icon: Package,
    tone: "blue",
  },
  {
    id: "total-warehouses",
    label: "Total Warehouses",
    value: "8",
    trendText: "1 new this month",
    trendDirection: "up",
    trendTone: "positive",
    icon: Warehouse,
    tone: "purple",
  },
  {
    id: "stock-value",
    label: "Total Stock Value",
    value: "AED 2.58M",
    trendText: "12.5% vs last week",
    trendDirection: "up",
    trendTone: "positive",
    icon: Boxes,
    tone: "green",
  },
  {
    id: "adjustments",
    label: "Total Adjustments",
    value: "32",
    note: "this week",
    trendText: "-5.3% vs last week",
    trendDirection: "down",
    trendTone: "negative",
    icon: ClipboardCheck,
    tone: "amber",
  },
  {
    id: "goods-receipts",
    label: "Goods Receipts",
    value: "14",
    note: "this week",
    trendText: "-12.0% vs last week",
    trendDirection: "down",
    trendTone: "negative",
    icon: ClipboardList,
    tone: "red",
  },
];

export interface WarehouseStockSlice {
  warehouse: string;
  /** Stock value in AED. */
  value: number;
  percentage: number;
  /** CSS color token so light/dark both resolve correctly. */
  fill: string;
}

export const totalStockValueLabel = "AED 2.58M";

export const warehouseStock: WarehouseStockSlice[] = [
  { warehouse: "Main Warehouse", value: 1050000, percentage: 40.7, fill: "var(--color-blue)" },
  { warehouse: "Dubai Warehouse", value: 820000, percentage: 31.8, fill: "var(--color-green)" },
  { warehouse: "Jebel Ali Warehouse", value: 410000, percentage: 15.9, fill: "var(--color-amber)" },
  { warehouse: "Abu Dhabi Warehouse", value: 210000, percentage: 8.1, fill: "var(--color-purple)" },
  { warehouse: "Sharjah Warehouse", value: 90000, percentage: 3.5, fill: "var(--color-red)" },
];

export interface StockMovementPoint {
  day: string;
  in: number;
  out: number;
}

export const stockMovement: StockMovementPoint[] = [
  { day: "May 12", in: 420, out: 310 },
  { day: "May 13", in: 380, out: 290 },
  { day: "May 14", in: 510, out: 360 },
  { day: "May 15", in: 460, out: 420 },
  { day: "May 16", in: 620, out: 380 },
  { day: "May 17", in: 540, out: 450 },
  { day: "May 18", in: 480, out: 330 },
];

export interface SummaryStat {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  tone: Tone;
}

export const summaryStats: SummaryStat[] = [
  { id: "low-stock", label: "Reorder / Low Stock Items", value: 5, icon: PackageSearch, tone: "red" },
  { id: "pending-transfers", label: "Pending Stock Transfers", value: 7, icon: ArrowLeftRight, tone: "blue" },
  { id: "pending-receipts", label: "Goods Receipts Pending", value: 18, icon: ClipboardList, tone: "amber" },
  { id: "pending-adjustments", label: "Adjustments Pending", value: 26, icon: ClipboardCheck, tone: "purple" },
];

export type MovementType = "IN" | "OUT" | "ADJ";

export interface StockMovementRow {
  id: string;
  date: string;
  type: MovementType;
  reference: string;
  product: string;
  warehouse: string;
  inQty: number | null;
  outQty: number | null;
  balance: number;
}

export const recentMovements: StockMovementRow[] = [
  {
    id: "mv-1",
    date: "May 18, 2024 10:30 AM",
    type: "IN",
    reference: "GRN-1000",
    product: "iPhone 15 Pro",
    warehouse: "Main Warehouse",
    inQty: 120,
    outQty: null,
    balance: 980,
  },
  {
    id: "mv-2",
    date: "May 18, 2024 09:15 AM",
    type: "OUT",
    reference: "SO-2050",
    product: "Samsung Galaxy S24",
    warehouse: "Dubai Warehouse",
    inQty: null,
    outQty: 30,
    balance: 450,
  },
  {
    id: "mv-3",
    date: "May 17, 2024 04:45 PM",
    type: "IN",
    reference: "GRN-0999",
    product: "HP Laptop 15",
    warehouse: "Main Warehouse",
    inQty: 50,
    outQty: null,
    balance: 320,
  },
  {
    id: "mv-4",
    date: "May 17, 2024 02:20 PM",
    type: "OUT",
    reference: "SO-2049",
    product: "Dell Monitor 24",
    warehouse: "Sharjah Warehouse",
    inQty: null,
    outQty: 10,
    balance: 150,
  },
  {
    id: "mv-5",
    date: "May 17, 2024 11:05 AM",
    type: "ADJ",
    reference: "ADJ-0045",
    product: "Logitech Mouse M90",
    warehouse: "Abu Dhabi Warehouse",
    inQty: 5,
    outQty: null,
    balance: 205,
  },
];

export interface LowStockItem {
  id: string;
  product: string;
  sku: string;
  warehouse: string;
  available: number;
  reorderLevel: number;
}

export const lowStockItems: LowStockItem[] = [
  { id: "ls-1", product: "Logitech Mouse M90", sku: "M90-BLK", warehouse: "Main Warehouse", available: 8, reorderLevel: 20 },
  { id: "ls-2", product: "HP Keyboard K1500", sku: "K1500", warehouse: "Dubai Warehouse", available: 12, reorderLevel: 25 },
  { id: "ls-3", product: "Sony WH-1000XM5", sku: "WH1000XM5", warehouse: "Sharjah Warehouse", available: 5, reorderLevel: 10 },
];
