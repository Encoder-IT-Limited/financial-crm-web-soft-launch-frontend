"use client";

import { usePathname } from "next/navigation";
import { usePublicSettings } from "../modules/settings/hooks/use-public-settings";

const MAINTENANCE_EXEMPT = ["/login", "/forgot-password", "/verify-otp", "/reset-password"];

export function PublicMaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = usePublicSettings();
  const exempt = MAINTENANCE_EXEMPT.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (data?.maintenanceMode && !exempt) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-text">We'll be back shortly</h1>
        <p className="mt-3 max-w-md text-[14px] text-text-3">
          {data.maintenanceMessage || "The site is undergoing scheduled maintenance."}
        </p>
      </main>
    );
  }

  return children;
}
