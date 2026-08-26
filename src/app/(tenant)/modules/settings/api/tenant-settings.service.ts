import { apiSend } from "@/lib/api/envelope";
import type { Me } from "@/types/identity";

export type TenantProfileInput = {
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  currency?: string;
};

export const tenantSettingsApi = {
  updateProfile: (input: TenantProfileInput) => apiSend<Me>("patch", "/tenant/profile", input),
};
