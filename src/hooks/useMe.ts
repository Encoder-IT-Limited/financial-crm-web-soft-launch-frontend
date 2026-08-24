"use client";

import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth/auth.service";

/** Live /me — AuthGate warms this on mount. */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authService.me(),
    staleTime: 60_000,
    retry: false,
  });
}
