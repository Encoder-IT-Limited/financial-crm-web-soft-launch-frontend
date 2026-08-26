"use client";

import { useQuery } from "@tanstack/react-query";
import { publicPlansApi } from "../api/plans.service";
import { PLANS } from "@/app/(public)/components/plans-data";

/** Active subscription plans from the API, with static seed as fallback. */
export function usePublicPlans() {
  return useQuery({
    queryKey: ["public-plans"],
    queryFn: publicPlansApi.list,
    placeholderData: PLANS,
    staleTime: 60_000,
  });
}
