import type { ModuleKey } from "@/lib/permissions";

export type Plan = {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  baseSeats: number;
  additionalSeatPrice: number;
  trialDays: number;
  minSeats?: number;
  maxSeats?: number | null;
  salesAssisted?: boolean;
  modules: ModuleKey[];
  popular?: boolean;
};
