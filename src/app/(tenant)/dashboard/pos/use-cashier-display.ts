import { useMe } from "@/hooks/useMe";
import type { PosSession } from "./types";

/** Resolves what to show for "who ran this shift." There's no Employees/HR
 * module yet to look up an arbitrary `cashierId`, so this can only verify
 * a session against the current viewer's own account — everyone else's
 * shift still falls back to the unverified free-text `openedBy` typed into
 * Start Shift. `verified: true` means the name shown is the real,
 * authenticated identity; `false` means it's just whatever was typed. */
export function useCashierDisplay(session: Pick<PosSession, "cashierId" | "openedBy">): {
  name: string;
  verified: boolean;
} {
  const { data: me } = useMe();
  if (me && session.cashierId === me.id) {
    return { name: me.name, verified: true };
  }
  return { name: session.openedBy, verified: false };
}
