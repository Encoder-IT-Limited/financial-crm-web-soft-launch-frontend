import type { ModuleKey } from "@/lib/permissions";

export type Plan = {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  baseSeats: number;
  additionalSeatPrice: number;
  trialDays: number;
  modules: ModuleKey[];
  popular?: boolean;
  /** Smallest seat count this plan can be purchased/estimated for. */
  minSeats: number;
  /** Largest seat count this plan supports — omitted/undefined means unlimited. */
  maxSeats?: number;
};
