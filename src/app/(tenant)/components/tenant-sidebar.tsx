import { Sidebar } from "@/components/shared/sidebar";
import { tenantNavSections } from "./nav-items";
import type { Me } from "@/types/identity";

export function TenantSidebar({ me }: { me?: Me | null }) {
  return (
    <Sidebar
      accent="blue"
      me={me}
      sections={tenantNavSections}
      brand={
        <div className="flex items-center gap-2.5">
          <div className="flex size-[30px] items-center justify-center rounded-lg bg-blue text-[13px] font-extrabold text-white">
            M
          </div>
          <span className="text-[13px] font-bold text-white">MRM Portal</span>
        </div>
      }
    />
  );
}
