"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";
import { mockIdentity } from "@/lib/dev/mock-identity";

// TEMPORARY: matches the bypass in src/proxy.ts. No backend exists yet
// anywhere — dev machine or the deployed demo — so /me can never really
// answer; always return a mock identity instead. Remove once a real backend
// is wired up.
const DEV_AUTH_BYPASS = true;

/** The one query every authenticated shell can assume is warm — AuthGate
 * triggers it on mount. */
export function useMe() {
  const pathname = usePathname();
  const devRealm: "admin" | "tenant" = pathname?.startsWith("/admin") ? "admin" : "tenant";

  return useQuery({
    queryKey: ["me", DEV_AUTH_BYPASS ? devRealm : "live"],
    queryFn: () =>
      DEV_AUTH_BYPASS ? Promise.resolve(mockIdentity(devRealm)) : authService.me(),
    staleTime: 60_000,
  });
}
