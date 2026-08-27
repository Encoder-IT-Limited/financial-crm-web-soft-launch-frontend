import { z } from "zod";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";

const MODULE_KEYS = Object.keys(MODULE_LABELS) as [ModuleKey, ...ModuleKey[]];

export const planSchema = z.object({
  name: z.string().trim().min(2, "Plan name is required"),
  priceMonthly: z.coerce.number().nonnegative("Monthly price can't be negative"),
  priceYearly: z.coerce.number().nonnegative("Yearly price can't be negative"),
  baseSeats: z.coerce.number().int().positive("Base seats must be at least 1"),
  additionalSeatPrice: z.coerce.number().nonnegative("Additional seat price can't be negative"),
  trialDays: z.coerce.number().int().nonnegative("Trial days can't be negative"),
  minSeats: z.coerce.number().int().positive("Minimum seats must be at least 1").optional(),
  maxSeats: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive("Maximum seats must be at least 1").nullable(),
  ),
  salesAssisted: z.boolean().default(false),
  modules: z.array(z.enum(MODULE_KEYS)).min(1, "Select at least one module"),
  popular: z.boolean().default(false),
});

export type PlanFormValues = z.infer<typeof planSchema>;
