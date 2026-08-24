import { apiGet, apiSend } from "@/lib/api/envelope";
import { rememberTenantSubdomain } from "@/lib/api/tenant-context";
import type { Me } from "@/types/identity";

function rememberFromMe(me: Me) {
  rememberTenantSubdomain(me.tenant?.subdomain);
  return me;
}

export const authService = {
  me: async () => rememberFromMe(await apiGet<Me>("/me")),
  login: async (body: { email: string; password: string }) =>
    rememberFromMe(await apiSend<Me>("post", "/auth/login", body)),
  logout: async () => {
    rememberTenantSubdomain(undefined);
    return apiSend<void>("post", "/auth/logout");
  },
  requestPasswordReset: (body: { email: string }) =>
    apiSend<void>("post", "/auth/forgot-password", body),
  resetPassword: (body: { email: string; otp: string; newPassword: string }) =>
    apiSend<void>("post", "/auth/reset-password", body),
};
