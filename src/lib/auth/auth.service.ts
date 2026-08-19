import { apiGet, apiSend } from "@/lib/api/envelope";
import type { Me } from "@/types/identity";

export const authService = {
  me: () => apiGet<Me>("/me"),
  // No `realm` param — the account itself determines it; the backend
  // returns the resolved realm on Me, and the caller routes off that.
  login: (body: { email: string; password: string }) => apiSend<Me>("post", "/auth/login", body),
  logout: () => apiSend<void>("post", "/auth/logout"),
  requestPasswordReset: (body: { email: string }) =>
    apiSend<void>("post", "/auth/forgot-password", body),
  resetPassword: (body: { email: string; otp: string; newPassword: string }) =>
    apiSend<void>("post", "/auth/reset-password", body),
};
