import { AppSidebar } from "@/components/shared/app-sidebar";
import { adminNavSections } from "./nav-items";
import type { Me } from "@/types/identity";

// Overrides the tenant-portal default (blue) so Super Admin reads as visually
// distinct without forking the sidebar primitive — see globals.css §"Sidebar".
const ADMIN_ACCENT_STYLE = {
  "--sidebar-accent": "rgba(124, 58, 237, 0.28)",
  "--sidebar-accent-foreground": "#ddd6fe",
} as React.CSSProperties;

export function AdminSidebar({ me }: { me?: Me | null }) {
  return (
    <AppSidebar
      me={me}
      sections={adminNavSections}
      style={ADMIN_ACCENT_STYLE}
      brand={
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-purple text-[13px] font-extrabold text-white">
            M
          </div>
          <div className="truncate leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-[13px] font-bold text-white">MRM Portal</div>
            <div className="text-[10px] font-semibold text-purple-t">Super Admin</div>
          </div>
        </div>
      }
    />
  );
}
