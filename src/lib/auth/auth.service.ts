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
    apiSend<{ accepted: true; otp?: string }>("post", "/auth/forgot-password", body),
  verifyOtp: (body: { email: string; otp: string }) =>
    apiSend<{ verified: true }>("post", "/auth/verify-otp", body),
  resetPassword: (body: { email: string; otp: string; newPassword: string }) =>
    apiSend<{ reset: true }>("post", "/auth/reset-password", {
      email: body.email,
      otp: body.otp,
      password: body.newPassword,
    }),
};
