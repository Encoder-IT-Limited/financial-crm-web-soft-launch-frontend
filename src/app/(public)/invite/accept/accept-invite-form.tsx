"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { usersApi } from "@/app/(tenant)/modules/users/api/users.service";
import { ApiError } from "@/lib/api/errors";
import { rememberTenantSubdomain } from "@/lib/api/tenant-context";
import { toast } from "@/lib/toast";
import type { InvitePreview } from "@/app/(tenant)/modules/users/types";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormErrors = { password?: string; confirmPassword?: string };

export function AcceptInviteForm({ token }: { token: string }) {
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      setLoadError("This invite link is missing a token.");
      return;
    }
    let cancelled = false;
    usersApi
      .previewInvite(token)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof ApiError ? error.message : "This invite is invalid or expired.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ password, confirmPassword });
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
      const me = await usersApi.acceptInvite({ token, password: result.data.password });
      rememberTenantSubdomain(me.tenant?.subdomain);
      queryClient.setQueryData(["me"], me);
      toast.success("Welcome — your account is ready.");
      router.push(me.realm === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Couldn't accept this invite. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <>
        <h1 className="text-2xl font-extrabold text-text">Invite unavailable</h1>
        <p className="mt-1.5 text-[13px] text-text-3">{loadError}</p>
        <Link href="/login" className="mt-6 inline-block text-[13px] font-medium text-blue hover:underline">
          Back to login
        </Link>
      </>
    );
  }

  if (!preview) {
    return (
      <>
        <h1 className="text-2xl font-extrabold text-text">Join your team</h1>
        <p className="mt-1.5 text-[13px] text-text-3">Checking your invite…</p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-text">Join {preview.tenantName}</h1>
      <p className="mt-1.5 text-[13px] text-text-3">
        {preview.name} ({preview.email}) — set a password to activate your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.password && <p className="mt-1 text-[11px] text-red">{errors.password}</p>}
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
          {submitting ? "Activating..." : "Activate account"}
        </button>
      </form>
    </>
  );
}
