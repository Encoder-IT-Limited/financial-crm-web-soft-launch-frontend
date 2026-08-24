"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { authService } from "@/lib/auth/auth.service";
import { ApiError } from "@/lib/api/errors";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

export function LoginForm() {
  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const me = await authService.login(result.data);
      queryClient.setQueryData(["me"], me);
      router.push(me.realm === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Login failed. Try again.");
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
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
        />
        {errors.email && <p className="mt-1 text-[11px] text-red">{errors.email}</p>}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[12px] font-semibold text-text-2">Password</label>
          <Link href="/forgot-password" className="text-[11.5px] font-medium text-blue hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => setField("password", e.target.value)}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 pr-10 text-[13px] text-text outline-none focus:border-blue"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-text-4 hover:text-text-2"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-[11px] text-red">{errors.password}</p>}
      </div>

      {formError && <p className="text-[12px] text-red">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
      >
        {submitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
