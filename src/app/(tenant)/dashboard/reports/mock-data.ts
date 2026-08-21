import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Calculator,
  CalendarClock,
  Package,
  Warehouse,
} from "lucide-react";

export type ReportCategory = "Stock Levels" | "Movement" | "Valuation" | "Warehouses";

export const REPORT_CATEGORIES: ReportCategory[] = [
  "Stock Levels",
  "Movement",
  "Valuation",
  "Warehouses",
];

export type ReportFormat = "pdf" | "excel" | "csv";

export type ReportStatus = "ready" | "processing" | "scheduled";

export const REPORT_FORMAT_LABEL: Record<ReportFormat, string> = {
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
};

export const REPORT_FORMAT_TONE: Record<ReportFormat, "red" | "green" | "blue"> = {
  pdf: "red",
  excel: "green",
  csv: "blue",
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  scheduled: "Scheduled",
};

export const REPORT_STATUS_TONE: Record<ReportStatus, "green" | "amber" | "purple"> = {
  ready: "green",
  processing: "amber",
  scheduled: "purple",
};

const CATEGORY_TONE: Record<ReportCategory, "blue" | "purple" | "green" | "amber"> = {
  Valuation: "blue",
  Movement: "purple",
  "Stock Levels": "green",
  Warehouses: "amber",
};

export function reportCategoryTone(category: ReportCategory) {
  return CATEGORY_TONE[category];
}

type QuickReportTone = "blue" | "purple" | "green" | "amber" | "red";

export interface QuickReport {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: ReportCategory;
  tone: QuickReportTone;
}

export const QUICK_REPORTS: QuickReport[] = [
  {
    id: "inventory-summary",
    title: "Inventory Summary",
    description: "Stock on hand across all warehouses with total values.",
    icon: Package,
    category: "Stock Levels",
    tone: "blue",
  },
  {
    id: "stock-movement",
    title: "Stock Movement",
    description: "Inbound, outbound, and transfer activity over time.",
    icon: ArrowLeftRight,
    category: "Movement",
    tone: "purple",
  },
  {
    id: "valuation",
    title: "Valuation",
    description: "FIFO and weighted-average cost basis of current stock.",
    icon: Calculator,
    category: "Valuation",
    tone: "green",
  },
  {
    id: "low-stock-alert",
    title: "Low Stock Alert",
    description: "Items at or below their reorder point.",
    icon: AlertTriangle,
    category: "Stock Levels",
    tone: "amber",
  },
  {
    id: "expiry-report",
    title: "Expiry Report",
    description: "Batches expiring within the next 90 days.",
    icon: CalendarClock,
    category: "Stock Levels",
    tone: "red",
  },
  {
    id: "warehouse-utilization",
    title: "Warehouse Utilization",
    description: "Capacity used per warehouse location.",
    icon: Warehouse,
    category: "Warehouses",
    tone: "blue",
  },
];

export const QUICK_REPORT_TONE_CLASS: Record<QuickReportTone, string> = {
  blue: "bg-blue-l text-blue",
  purple: "bg-purple-l text-purple",
  green: "bg-green-l text-green",
  amber: "bg-amber-l text-amber",
  red: "bg-red-l text-red",
};

export interface GeneratedReport {
  id: string;
  name: string;
  category: ReportCategory;
  /** ISO datetime — for scheduled rows this is the next run. */
  generatedAt: string;
  format: ReportFormat;
  fileSize: string;
  status: ReportStatus;
}

/** Mock history — replace with the reports API response later. */
export const generatedReports: GeneratedReport[] = [
  { id: "rep-001", name: "Ad-hoc Movement Export", category: "Movement", generatedAt: "2026-08-21T10:37:00", format: "csv", fileSize: "—", status: "processing" },
  { id: "rep-002", name: "Month-End Valuation - Sep 2026", category: "Valuation", generatedAt: "2026-09-01T06:00:00", format: "pdf", fileSize: "—", status: "scheduled" },
  { id: "rep-003", name: "Monthly Inventory Summary - Aug 2026", category: "Stock Levels", generatedAt: "2026-08-20T09:14:00", format: "pdf", fileSize: "2.4 MB", status: "ready" },
  { id: "rep-004", name: "Stock Valuation (FIFO) - Aug 2026", category: "Valuation", generatedAt: "2026-08-18T16:40:00", format: "excel", fileSize: "864 KB", status: "ready" },
  { id: "rep-005", name: "Weekly Stock Movement - W33", category: "Movement", generatedAt: "2026-08-17T08:05:00", format: "pdf", fileSize: "1.1 MB", status: "ready" },
  { id: "rep-006", name: "Low Stock Alert - Aug 2026", category: "Stock Levels", generatedAt: "2026-08-15T07:30:00", format: "csv", fileSize: "96 KB", status: "ready" },
  { id: "rep-007", name: "Warehouse Utilization - Q3 2026", category: "Warehouses", generatedAt: "2026-08-12T14:22:00", format: "pdf", fileSize: "3.2 MB", status: "ready" },
  { id: "rep-008", name: "Batch Expiry Forecast - Sep 2026", category: "Stock Levels", generatedAt: "2026-08-10T11:48:00", format: "excel", fileSize: "512 KB", status: "ready" },
  { id: "rep-009", name: "Monthly Inventory Summary - Jul 2026", category: "Stock Levels", generatedAt: "2026-07-20T09:02:00", format: "pdf", fileSize: "2.2 MB", status: "ready" },
  { id: "rep-010", name: "Stock Valuation (Weighted Avg) - Jul 2026", category: "Valuation", generatedAt: "2026-07-15T17:31:00", format: "excel", fileSize: "842 KB", status: "ready" },
  { id: "rep-011", name: "Reorder Suggestions - Jul 2026", category: "Stock Levels", generatedAt: "2026-07-10T08:15:00", format: "csv", fileSize: "88 KB", status: "ready" },
  { id: "rep-012", name: "Quarterly Movement Digest - Q2 2026", category: "Movement", generatedAt: "2026-06-30T18:00:00", format: "pdf", fileSize: "4.6 MB", status: "ready" },
];

export function reportSizeBytes(size: string): number {
  const match = size.match(/^([\d.]+)\s*(KB|MB)$/);
  if (!match) return 0;
  const value = Number(match[1]);
  return match[2] === "MB" ? value * 1_048_576 : value * 1024;
}

export interface TurnoverPoint {
  month: string;
  rate: number;
}

export const inventoryTurnover: TurnoverPoint[] = [
  { month: "Mar", rate: 1.8 },
  { month: "Apr", rate: 2.0 },
  { month: "May", rate: 1.9 },
  { month: "Jun", rate: 2.2 },
  { month: "Jul", rate: 2.1 },
  { month: "Aug", rate: 2.4 },
];

export interface TopProductValue {
  name: string;
  value: number;
}

export const topProductsByValue: TopProductValue[] = [
  { name: "iPhone 15 Pro", value: 520316 },
  { name: "Samsung Galaxy S24", value: 218736 },
  { name: "HP Laptop 15", value: 122508 },
  { name: "Ergonomic Office Chair", value: 108826 },
  { name: "Standing Desk 140cm", value: 78588 },
];

export function formatAxisAed(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}
