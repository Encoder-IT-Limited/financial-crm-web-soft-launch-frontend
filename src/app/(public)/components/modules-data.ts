import {
  BookText,
  FileText,
  Wallet,
  Package,
  Landmark,
  Users,
  ClipboardList,
  Sparkles,
  ScanBarcode,
  UserRound,
  CalendarClock,
  Share2,
} from "lucide-react";
import type { ModuleShowcaseItem } from "./module-showcase-card";

// Full module lineup from the proposal — including Phase 2/3 modules not
// built yet (marked comingSoon) — per docs/Public-SuperAdmin-Plan.md §2.4:
// the product will eventually ship all of it, so the marketing story is
// complete now rather than re-plumbed as each phase lands.
export const MODULES: ModuleShowcaseItem[] = [
  {
    key: "accounting",
    name: "Accounting",
    description: "Chart of accounts, journal entries, ledger, trial balance, and balance sheet.",
    icon: BookText,
  },
  {
    key: "invoicing",
    name: "Invoicing",
    description: "Invoices, proposals, retainers, and credit & debit notes with payment tracking.",
    icon: FileText,
  },
  {
    key: "expenses",
    name: "Expenses",
    description: "Expense tracking with AI receipt scanning and approval workflows.",
    icon: Wallet,
  },
  {
    key: "inventory",
    name: "Inventory & Procurement",
    description: "Stock levels, purchase orders, goods receipts, and multi-warehouse transfers.",
    icon: Package,
  },
  {
    key: "banking",
    name: "Banking",
    description: "Connected bank accounts, transactions, and reconciliation.",
    icon: Landmark,
  },
  {
    key: "crm",
    name: "CRM",
    description: "Customers, vendors, inquiries, and a leads pipeline in one place.",
    icon: Users,
  },
  {
    key: "reports",
    name: "Reports & Compliance",
    description: "Financial reports plus built-in VAT and Corporate Tax reporting.",
    icon: ClipboardList,
  },
  {
    key: "ai-assistant",
    name: "AI Assistant",
    description: "OCR receipt scanning, auto-categorization, and intelligent suggestions.",
    icon: Sparkles,
  },
  {
    key: "pos",
    name: "POS",
    description: "Point of sale for web, Android, and iOS with offline support.",
    icon: ScanBarcode,
    comingSoon: true,
  },
  {
    key: "hr-payroll",
    name: "HR & Payroll",
    description: "Employee profiles, attendance, leave, and payroll processing.",
    icon: UserRound,
    comingSoon: true,
  },
  {
    key: "calendar-booking",
    name: "Calendar & Booking",
    description: "Staff scheduling, client appointments, and resource booking.",
    icon: CalendarClock,
    comingSoon: true,
  },
  {
    key: "social-media",
    name: "Social Media",
    description: "Schedule and publish posts across Facebook, Instagram, LinkedIn, and X.",
    icon: Share2,
    comingSoon: true,
  },
];
