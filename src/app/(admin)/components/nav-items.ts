import { Building2, Trophy, CreditCard, ScrollText, Settings } from "lucide-react";
import type { SidebarNavSection } from "@/types/nav";

export const adminNavSections: SidebarNavSection[] = [
  {
    items: [
      { label: "All Clients", href: "/admin/tenants", icon: Building2 },
      { label: "Plans & Pricing", href: "/admin/plans", icon: Trophy },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
