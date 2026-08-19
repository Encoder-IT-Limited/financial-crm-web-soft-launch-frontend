import { apiGet, apiSend } from "@/lib/api/envelope";
import type { Me } from "@/types/identity";

export const authService = {
  me: () => apiGet<Me>("/me"),
  login: (body: { email: string; password: string; realm: "admin" | "tenant" }) =>
    apiSend<Me>("post", "/auth/login", body),
  logout: () => apiSend<void>("post", "/auth/logout"),
};
