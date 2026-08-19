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
};
