import { z } from "zod";

export const tenantEditSchema = z.object({
  name: z.string().trim().min(2, "Tenant name is required"),
  legalName: z.string().trim().min(2, "Legal name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(5, "Enter a valid phone number"),
  address: z.string().trim().min(1, "Address is required"),
  planId: z.string().min(1, "Select a plan"),
  status: z.enum(["active", "read-only", "pending-deletion", "cancelled"]),
  billingCycle: z.enum(["monthly", "yearly"]),
  renewalDate: z.string().min(1, "Renewal date is required"),
  extraSeatsPurchased: z.coerce.number().int().nonnegative("Can't be negative"),
});

export type TenantEditValues = z.infer<typeof tenantEditSchema>;
