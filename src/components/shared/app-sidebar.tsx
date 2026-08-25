"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { can, hasModule } from "@/lib/permissions";
import type { Me } from "@/types/identity";
import type { SidebarNavSection } from "@/types/nav";

type AppSidebarProps = {
  brand: React.ReactNode;
  sections: SidebarNavSection[];
  me?: Me | null;
  /** CSS custom-property overrides (e.g. --sidebar-accent) so each portal can
   * tint its active/hover state without forking the primitive. */
  style?: React.CSSProperties;
};

function visibleItems(section: SidebarNavSection, me?: Me | null) {
  return section.items.filter((item) => {
    if (item.permission && !can(me, item.permission)) return false;
    if (item.module && !hasModule(me, item.module)) return false;
    return true;
  });
}

export function AppSidebar({ brand, sections, me, style }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" style={style} className="border-sidebar-border">
      <SidebarHeader>{brand}</SidebarHeader>
      <SidebarContent>
        {sections.map((section, idx) => {
          const items = visibleItems(section, me);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.label ?? idx}>
              {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    // A nav item whose own href is a literal prefix of a sibling
                    // item's href (e.g. "Register" at /dashboard/pos vs. "Sales"
                    // at /dashboard/pos/sales) must never prefix-match — otherwise
                    // it stays highlighted on every sibling page. Same reasoning
                    // as the portal-root special case, generalized instead of
                    // hardcoded per path.
                    const isRoot =
                      item.href === "/dashboard" ||
                      item.href === "/admin" ||
                      items.some((other) => other !== item && other.href.startsWith(`${item.href}/`));
                    const active =
                      pathname === item.href ||
                      (!isRoot && pathname.startsWith(`${item.href}/`));
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.label}
                          render={<Link href={item.href} />}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.badge != null && (
                          <SidebarMenuBadge className="bg-red-l text-red">
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
