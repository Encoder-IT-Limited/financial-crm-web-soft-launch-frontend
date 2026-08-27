"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { OtpInput } from "@/components/shared/otp-input";
import { authService } from "@/lib/auth/auth.service";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";

const schema = z.object({ otp: z.string().length(6, "Enter the 6-digit code") });

type VerifyOtpFormProps = {
  /** Resolved server-side from the ?email= query param (page.tsx) instead of
   * useSearchParams(), so the page doesn't need a client-only Suspense gate. */
  email: string;
};

export function VerifyOtpForm({ email }: VerifyOtpFormProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    try {
      const result = await authService.requestPasswordReset({ email });
      toast.success("Code resent.");
      if (result.otp) toast.info(`Dev OTP: ${result.otp}`);
    } catch {
      toast.error("Couldn't resend the code. Try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ otp });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter the 6-digit code");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authService.verifyOtp({ email, otp: result.data.otp });
      router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${result.data.otp}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired verification code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link
        href="/forgot-password"
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-3 hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <h1 className="text-2xl font-extrabold text-text">Enter verification code</h1>
      <p className="mt-1.5 text-[13px] text-text-3">
        {email ? (
          <>
            We sent a code to <span className="font-medium text-text-2">{email}</span>.
          </>
        ) : (
          "Enter the code we sent to your email."
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Verification code</label>
          <OtpInput value={otp} onChange={setOtp} />
          {error && <p className="mt-1 text-[11px] text-red">{error}</p>}
        </div>

        <button
          type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
      >
        {submitting ? "Verifying..." : "Verify code"}
        </button>

        <p className="text-center text-[12px] text-text-3">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-blue hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend"}
          </button>
        </p>
      </form>
    </>
  );
}
