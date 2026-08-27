import { z } from "zod";

export const generalSettingsSchema = z.object({
  platformName: z.string().trim().min(2, "Platform name is required"),
  logoUrl: z.string(),
  tagline: z.string().trim().min(1, "Tagline is required").max(120, "Keep it under 120 characters"),
  contactEmail: z.string().trim().email("Enter a valid email"),
  currency: z.string().trim().min(3, "Currency is required").max(8),
  maintenanceEnabled: z.boolean(),
  maintenanceMessage: z.string().trim().max(240, "Keep it under 240 characters"),
});

export type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export const legalSchema = z.object({
  privacyBody: z.string().trim().min(1, "Privacy policy body can't be empty"),
  termsBody: z.string().trim().min(1, "Terms of service body can't be empty"),
});

export type LegalFormValues = z.infer<typeof legalSchema>;

export const socialLinksSchema = z.object({
  linkedin: z.string().trim().url("Enter a valid URL").or(z.literal("")),
  twitter: z.string().trim().url("Enter a valid URL").or(z.literal("")),
  instagram: z.string().trim().url("Enter a valid URL").or(z.literal("")),
});

export type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;
