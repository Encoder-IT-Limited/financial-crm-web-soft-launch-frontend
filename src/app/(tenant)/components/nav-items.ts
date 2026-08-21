import {
  LayoutGrid,
  ListTree,
  BookText,
  Scale,
  FileBarChart,
  FileText,
  FileSignature,
  Repeat,
  Receipt,
  Wallet,
  BarChart3,
  Package,
  ArrowLeftRight,
  Landmark,
  Users,
  UserRound,
  MessageSquareText,
  UserPlus,
  FileDiff,
  ClipboardList,
  Percent,
  Building2,
  CalendarClock,
  Bell,
  Sparkles,
  Settings,
} from "lucide-react";
import type { SidebarNavSection } from "@/types/nav";

export const tenantNavSections: SidebarNavSection[] = [
  {
    label: "Accounting",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, module: "accounting" },
      { label: "Chart of Accounts", href: "/dashboard/chart-accounts", icon: ListTree, module: "accounting" },
      { label: "Journal Entry", href: "/dashboard/journal", icon: BookText, module: "accounting" },
      { label: "General Ledger", href: "/dashboard/ledger", icon: BookText, module: "accounting" },
      { label: "Trial Balance", href: "/dashboard/trial-balance", icon: Scale, module: "accounting" },
      { label: "Balance Sheet", href: "/dashboard/balance-sheet", icon: FileBarChart, module: "accounting" },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Customers", href: "/dashboard/customers", icon: Users, module: "crm" },
      { label: "Vendors", href: "/dashboard/vendors", icon: UserRound, module: "crm" },
      { label: "Inquiries", href: "/dashboard/inquiries", icon: MessageSquareText, module: "crm" },
      { label: "Leads Pipeline", href: "/dashboard/leads", icon: UserPlus, module: "crm" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Invoices", href: "/dashboard/invoices", icon: FileText, module: "sales" },
      { label: "Proposals", href: "/dashboard/proposals", icon: FileSignature, module: "sales" },
      { label: "Retainers", href: "/dashboard/retainers", icon: Repeat, module: "sales" },
      { label: "Credit & Debit Notes", href: "/dashboard/credit-notes", icon: FileDiff, module: "sales" },
    ],
  },
  {
    label: "Purchases",
    items: [
      { label: "Bills", href: "/dashboard/bills", icon: Receipt, module: "purchasing" },
      { label: "Expenses", href: "/dashboard/expenses", icon: Wallet, module: "purchasing" },
      { label: "Budget", href: "/dashboard/budget", icon: BarChart3, module: "purchasing" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Products & SKU", href: "/dashboard/products", icon: Package, module: "inventory" },
      { label: "Stock Movement", href: "/dashboard/inv-movement", icon: ArrowLeftRight, module: "inventory" },
    ],
  },
  {
    label: "Reports & Compliance",
    items: [
      { label: "All Reports", href: "/dashboard/reports", icon: ClipboardList, module: "reports" },
      { label: "VAT Report", href: "/dashboard/reports/vat", icon: Percent, module: "reports" },
      { label: "Corporate Tax", href: "/dashboard/reports/corp-tax", icon: Building2, module: "reports" },
      { label: "Scheduled Reports", href: "/dashboard/reports/scheduled", icon: CalendarClock, module: "reports" },
    ],
  },
  {
    label: "Banking",
    items: [
      { label: "Bank Accounts", href: "/dashboard/banking", icon: Landmark, module: "banking" },
      { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight, module: "banking" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
      { label: "AI Assistant", href: "/dashboard/ai", icon: Sparkles, module: "ai-assistant" },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];
