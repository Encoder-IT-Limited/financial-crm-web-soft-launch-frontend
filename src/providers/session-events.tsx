"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { onUnauthorized } from "@/lib/api/session";
import { toast } from "@/lib/toast";

/** Subscribes to the global 401 interceptor: clears the query cache and
 * redirects to /login. Catches session expiry mid-session, not just on
 * initial load. */
export function SessionEvents() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      queryClient.clear();
      toast.error("Your session has expired. Please sign in again.");
      router.replace("/login");
    });
    return () => {
      unsubscribe();
    };
  }, [router, queryClient]);

  return null;
}
