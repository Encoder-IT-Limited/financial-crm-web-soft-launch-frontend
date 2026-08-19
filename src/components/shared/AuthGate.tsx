"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import type { Realm } from "@/types/identity";

type AuthGateProps = {
  realm: Realm;
  children: (me: NonNullable<ReturnType<typeof useMe>["data"]>) => React.ReactNode;
};

/**
 * Gates the entire authenticated shell (sidebar + navbar + content), not just
 * page content — gating only {children} lets the sidebar/navbar flash before
 * the redirect fires. Real authorization is still re-checked server-side on
 * every request; this is a UX guard only.
 */
export function AuthGate({ realm, children }: AuthGateProps) {
  const { data: me, isPending, isError } = useMe();
  const router = useRouter();

  const wrongRealm = me && me.realm !== realm;

  useEffect(() => {
    if (isError || wrongRealm) {
      router.replace("/login");
    }
  }, [isError, wrongRealm, router]);

  if (isPending) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-blue" />
      </div>
    );
  }

  if (isError || !me || wrongRealm) {
    return null;
  }

  return <>{children(me)}</>;
}
