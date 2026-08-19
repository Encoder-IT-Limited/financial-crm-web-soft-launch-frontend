import { Sidebar } from "@/components/shared/Sidebar";
import { adminNavSections } from "./nav-items";
import type { Me } from "@/types/identity";

export function AdminSidebar({ me }: { me?: Me | null }) {
  return (
    <Sidebar
      accent="purple"
      me={me}
      sections={adminNavSections}
      brand={
        <div className="flex items-center gap-2.5">
          <div className="flex size-[30px] items-center justify-center rounded-lg bg-purple text-[13px] font-extrabold text-white">
            M
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-white">MRM Portal</div>
            <div className="text-[10px] font-semibold text-purple-t">Super Admin</div>
          </div>
        </div>
      }
    />
  );
}
