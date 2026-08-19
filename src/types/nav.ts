import type { ComponentType } from "react";
import type { ModuleKey } from "@/lib/permissions";

export type IconProps = { className?: string };

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
  /** Any one permission grants visibility. Omit for platform-only items. */
  permission?: string | string[];
  /** Must be in the tenant's active plan. Omit for platform-only items. */
  module?: ModuleKey;
  badge?: string | number;
};

export type SidebarNavSection = {
  label?: string;
  items: SidebarNavItem[];
};
