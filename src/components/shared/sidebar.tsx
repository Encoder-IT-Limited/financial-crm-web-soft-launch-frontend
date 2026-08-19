"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "./sidebar-collapse-provider";
import type { Me } from "@/types/identity";
import type { SidebarNavSection } from "@/types/nav";
import { can, hasModule } from "@/lib/permissions";

type SidebarProps = {
  brand: React.ReactNode;
  sections: SidebarNavSection[];
  me?: Me | null;
  accent?: "blue" | "purple";
};

function visibleItems(section: SidebarNavSection, me?: Me | null) {
  return section.items.filter((item) => {
    if (item.permission && !can(me, item.permission)) return false;
    if (item.module && !hasModule(me, item.module)) return false;
    return true;
  });
}

export function Sidebar({ brand, sections, me, accent = "blue" }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarCollapse();

  const accentClasses = {
    blue: {
      active: "bg-blue-l text-blue border-l-blue",
      hover: "hover:bg-blue-l/60 hover:text-blue",
    },
    purple: {
      active: "bg-purple/25 text-purple-t border-l-purple",
      hover: "hover:bg-purple/15 hover:text-purple-t",
    },
  }[accent];

  const content = (
    <nav className="flex h-full flex-col overflow-y-auto py-4">
      <div className="px-4 pb-4">{brand}</div>
      {sections.map((section, idx) => {
        const items = visibleItems(section, me);
        if (items.length === 0) return null;
        return (
          <div key={section.label ?? idx} className="mb-2">
            {section.label && (
              <div className="px-[18px] pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-text-4">
                {section.label}
              </div>
            )}
            {items.map((item) => {
              const isRoot = item.href === "/dashboard" || item.href === "/admin";
              const active =
                pathname === item.href || (!isRoot && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 border-l-[3px] border-transparent px-[18px] py-2.5 text-[12.5px] font-medium text-text-3 transition-all duration-150",
                    accentClasses.hover,
                    active && cn("font-semibold", accentClasses.active)
                  )}
                >
                  <item.icon className="size-[15px] shrink-0 opacity-70" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge != null && (
                    <span className="ml-auto rounded-full bg-red-l px-1.5 py-0.5 text-[10px] font-bold text-red">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-navy text-white lg:block",
          collapsed ? "w-[72px]" : "w-[248px]"
        )}
      >
        {content}
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[248px] animate-[slide-in_0.2s_ease-out] bg-navy text-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-white/70 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
