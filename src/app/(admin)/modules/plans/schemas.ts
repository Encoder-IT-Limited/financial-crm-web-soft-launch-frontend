import { z } from "zod";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";

const MODULE_KEYS = Object.keys(MODULE_LABELS) as [ModuleKey, ...ModuleKey[]];

export const planSchema = z
  .object({
    name: z.string().trim().min(2, "Plan name is required"),
    priceMonthly: z.coerce.number().nonnegative("Monthly price can't be negative"),
    priceYearly: z.coerce.number().nonnegative("Yearly price can't be negative"),
    baseSeats: z.coerce.number().int().positive("Base seats must be at least 1"),
    additionalSeatPrice: z.coerce.number().nonnegative("Additional seat price can't be negative"),
    trialDays: z.coerce.number().int().nonnegative("Trial days can't be negative"),
    modules: z.array(z.enum(MODULE_KEYS)).min(1, "Select at least one module"),
    popular: z.boolean().default(false),
    minSeats: z.coerce.number().int().positive("Minimum seats must be at least 1"),
    // Empty/undefined means "unlimited" — only coerce to a number when something was typed.
    maxSeats: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : val),
      z.coerce.number().int().positive("Maximum seats must be greater than 0").optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.maxSeats !== undefined && data.maxSeats < data.minSeats) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxSeats"],
        message: "Max seats can't be less than min seats",
      });
    }
  });

export type PlanFormValues = z.infer<typeof planSchema>;
