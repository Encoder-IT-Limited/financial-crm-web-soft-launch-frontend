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
// built yet (marked comingSoon) — per docs/plans/Public-SuperAdmin-Plan.md §2.4:
// the product will eventually ship all of it, so the marketing story is
// complete now rather than re-plumbed as each phase lands.
export const MODULES: ModuleShowcaseItem[] = [
  {
    key: "accounting",
    name: "Accounting",
    description: "Chart of accounts, journal entries, ledger, trial balance, and balance sheet.",
    icon: BookText,
    highlights: [
      "Full chart of accounts with custom account types",
      "Manual journal entries and an auditable general ledger",
      "Trial balance and balance sheet, always up to date",
    ],
  },
  {
    key: "invoicing",
    name: "Invoicing",
    description: "Invoices, proposals, retainers, and credit & debit notes with payment tracking.",
    icon: FileText,
    highlights: [
      "Recurring invoices with draft-first, opt-in auto-send",
      "Partial and multiple payments per invoice",
      "Credit & debit notes linked to returns and refunds",
    ],
  },
  {
    key: "expenses",
    name: "Expenses",
    description: "Expense tracking with AI receipt scanning and approval workflows.",
    icon: Wallet,
    highlights: [
      "Snap a receipt — AI extracts vendor, amount, tax, and category",
      "Approval workflow before an expense posts",
      "Categorized, vendor-tracked, and export-ready",
    ],
  },
  {
    key: "inventory",
    name: "Inventory & Procurement",
    description: "Stock levels, purchase orders, goods receipts, and multi-warehouse transfers.",
    icon: Package,
    highlights: [
      "Purchase orders with partial goods receipt support",
      "Multi-warehouse stock with request-approve-dispatch-receive transfers",
      "FEFO/FIFO batch issuing and weighted-average valuation",
    ],
  },
  {
    key: "banking",
    name: "Banking",
    description: "Connected bank accounts, transactions, and reconciliation.",
    icon: Landmark,
    highlights: [
      "Multiple bank and cash accounts per business",
      "Transaction categorization and matching",
      "Reconciliation against bank statements",
    ],
  },
  {
    key: "crm",
    name: "CRM",
    description: "Customers, vendors, inquiries, and a leads pipeline in one place.",
    icon: Users,
    highlights: [
      "Customer and vendor directories tied to every transaction",
      "Inquiry tracking so nothing falls through the cracks",
      "A visual leads pipeline from first contact to close",
    ],
  },
  {
    key: "reports",
    name: "Reports & Compliance",
    description: "Financial reports plus built-in VAT and Corporate Tax reporting.",
    icon: ClipboardList,
    highlights: [
      "UAE VAT and Corporate Tax reports built in",
      "Scheduled reports delivered on a recurring basis",
      "Filter by date, branch, warehouse, customer, or vendor",
    ],
  },
  {
    key: "ai-assistant",
    name: "AI Assistant",
    description: "OCR receipt scanning, auto-categorization, and intelligent suggestions.",
    icon: Sparkles,
    highlights: [
      "OCR extraction with a confidence score on every field",
      "Nothing posts automatically without your review",
      "Plain-language business summaries on demand",
    ],
  },
  {
    key: "pos",
    name: "POS",
    description: "Point of sale for web, Android, and iOS with offline support.",
    icon: ScanBarcode,
    comingSoon: true,
    highlights: [
      "Barcode scanning, split payments, and cash-drawer integration",
      "Keeps taking sales offline, syncs automatically when back online",
      "Register-level cash reconciliation and manager-PIN overrides",
    ],
  },
  {
    key: "hr-payroll",
    name: "HR & Payroll",
    description: "Employee profiles, attendance, leave, and payroll processing.",
    icon: UserRound,
    comingSoon: true,
    highlights: [
      "Employee profiles, departments, and designations",
      "Attendance, leave balances, and approvals",
      "Payroll runs with salary slips generated automatically",
    ],
  },
  {
    key: "calendar-booking",
    name: "Calendar & Booking",
    description: "Staff scheduling, client appointments, and resource booking.",
    icon: CalendarClock,
    comingSoon: true,
    highlights: [
      "Staff schedules and resource booking in one calendar",
      "Client appointment booking with conflict detection",
      "Automated reminders for upcoming appointments",
    ],
  },
  {
    key: "social-media",
    name: "Social Media",
    description: "Schedule and publish posts across Facebook, Instagram, LinkedIn, and X.",
    icon: Share2,
    comingSoon: true,
    highlights: [
      "Connect Facebook, Instagram, LinkedIn, and X accounts",
      "Schedule and publish posts from one place",
      "Track publishing status and campaign performance",
    ],
  },
];
