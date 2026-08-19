"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { onUnauthorized } from "@/lib/api/session";

/** Subscribes to the global 401 interceptor: clears the query cache and
 * redirects to /login. Catches session expiry mid-session, not just on
 * initial load. */
export function SessionEvents() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      queryClient.clear();
      router.replace("/login");
    });
    return () => {
      unsubscribe();
    };
  }, [router, queryClient]);

  return null;
}
