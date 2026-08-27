"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { authService } from "@/lib/auth/auth.service";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      const parsed = result.data;
      const reset = await authService.requestPasswordReset(parsed);
      if (reset.otp) toast.info(`Dev OTP: ${reset.otp}`);
      router.push(`/verify-otp?email=${encodeURIComponent(parsed.email)}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Couldn't send a code. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
      <div>
        <label className="mb-1 block text-[12px] font-semibold text-text-2">Email</label>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
        />
        {error && <p className="mt-1 text-[11px] text-red">{error}</p>}
      </div>

      {formError && <p className="text-[12px] text-red">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send code"}
      </button>
    </form>
  );
}
