import { AppSidebar } from "@/components/shared/app-sidebar";
import { tenantNavSections } from "./nav-items";
import type { Me } from "@/types/identity";

export function TenantSidebar({ me }: { me?: Me | null }) {
  return (
    <AppSidebar
      me={me}
      sections={tenantNavSections}
      brand={
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-blue text-[13px] font-extrabold text-white">
            M
          </div>
          <span className="truncate text-[13px] font-bold text-white group-data-[collapsible=icon]:hidden">
            MRM Portal
          </span>
        </div>
      }
    />
  );
}
