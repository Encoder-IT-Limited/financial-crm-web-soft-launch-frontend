import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth/auth.service";

/** The one query every authenticated shell can assume is warm — AuthGate
 * triggers it on mount. */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: authService.me,
    staleTime: 60_000,
  });
}
