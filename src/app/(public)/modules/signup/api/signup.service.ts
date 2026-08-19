import { apiSend } from "@/lib/api/envelope";
import type { Me } from "@/types/identity";

export type SignupPayload = {
  planId: string;
  company: { name: string; country: string };
  owner: { name: string; email: string; password: string };
};

export const signupService = {
  create: (body: SignupPayload) => apiSend<Me>("post", "/auth/signup", body),
};
