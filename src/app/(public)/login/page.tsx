"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { authService } from "@/lib/auth/auth.service";
import { ApiError } from "@/lib/api/errors";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [realm, setRealm] = useState<"tenant" | "admin">("tenant");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setSubmitting(true);
    try {
      const me = await authService.login({ ...values, realm });
      router.push(me.realm === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Login failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-navy px-4 py-10">
      <div className="w-[420px] max-w-full rounded-[20px] bg-surface p-8 shadow-2xl sm:p-11">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue text-base font-extrabold text-white">
            M
          </div>
          <span className="text-base font-bold text-text">MRM Portal</span>
        </div>

        <div className="mb-5 flex gap-0.5 rounded-lg bg-surface-subtle p-1">
          {(
            [
              { key: "tenant", label: "Client" },
              { key: "admin", label: "Super Admin" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRealm(tab.key)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-[12.5px] font-medium text-text-3 transition-colors",
                realm === tab.key && "bg-surface font-semibold text-text shadow-sm"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-blue"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-red">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-blue"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-[11px] text-red">{errors.password.message}</p>
            )}
          </div>

          {formError && <p className="text-[12px] text-red">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
