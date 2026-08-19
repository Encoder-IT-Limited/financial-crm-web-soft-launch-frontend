"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { authService } from "@/lib/auth/auth.service";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormErrors = { newPassword?: string; confirmPassword?: string };

type ResetPasswordFormProps = {
  /** Resolved server-side from the ?email=&otp= query params (page.tsx)
   * instead of useSearchParams(), so the page doesn't need a client-only
   * Suspense gate. */
  email: string;
  otp: string;
};

export function ResetPasswordForm({ email, otp }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormErrors] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await authService.resetPassword({ email, otp, newPassword: result.data.newPassword });
      toast.success("Password reset — log in with your new password.");
      router.push("/login");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Couldn't reset your password. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link
        href="/verify-otp"
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-3 hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <h1 className="text-2xl font-extrabold text-text">Set a new password</h1>
      <p className="mt-1.5 text-[13px] text-text-3">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">New password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.newPassword && <p className="mt-1 text-[11px] text-red">{errors.newPassword}</p>}
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.confirmPassword && <p className="mt-1 text-[11px] text-red">{errors.confirmPassword}</p>}
        </div>

        {formError && <p className="text-[12px] text-red">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </>
  );
}
