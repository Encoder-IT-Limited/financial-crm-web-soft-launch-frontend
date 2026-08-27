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

export const tenantCreateSchema = z.object({
  name: z.string().trim().min(2, "Tenant name is required"),
  subdomain: z
    .string()
    .trim()
    .min(1, "Subdomain is required")
    .max(63, "Subdomain must be 63 characters or less")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits, and hyphens only"),
  ownerName: z.string().trim().min(2, "Owner name is required"),
  ownerEmail: z.string().trim().email("Enter a valid email"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
  legalName: z.string().trim().optional(),
  country: z.string().trim().optional(),
  planId: z.string().optional(),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export type TenantCreateValues = z.infer<typeof tenantCreateSchema>;
