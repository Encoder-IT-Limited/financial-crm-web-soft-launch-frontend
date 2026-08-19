"use client";

import { useState } from "react";
import { z } from "zod";

const infoSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required"),
    country: z.string().min(1, "Country is required"),
    fullName: z.string().min(1, "Your name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type InfoValues = z.infer<typeof infoSchema>;
type InfoErrors = Partial<Record<keyof InfoValues, string>>;

type InfoStepProps = {
  planName?: string;
  defaultValues: InfoValues;
  onSubmit: (values: InfoValues) => void;
};

export function InfoStep({ planName, defaultValues, onSubmit }: InfoStepProps) {
  const [info, setInfo] = useState<InfoValues>(defaultValues);
  const [errors, setErrors] = useState<InfoErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = infoSchema.safeParse(info);
    if (!result.success) {
      const fieldErrors: InfoErrors = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as keyof InfoValues] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-text">Create your account</h1>
      <p className="mt-1.5 text-[13px] text-text-3">
        {planName ? (
          <>
            Signing up for <span className="font-semibold text-text-2">{planName}</span>.
          </>
        ) : (
          "Tell us about you and your company."
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">Company name</label>
            <input
              value={info.companyName}
              onChange={(e) => setInfo((v) => ({ ...v, companyName: e.target.value }))}
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
            />
            {errors.companyName && <p className="mt-1 text-[11px] text-red">{errors.companyName}</p>}
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">Country</label>
            <input
              value={info.country}
              onChange={(e) => setInfo((v) => ({ ...v, country: e.target.value }))}
              placeholder="United Arab Emirates"
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
            />
            {errors.country && <p className="mt-1 text-[11px] text-red">{errors.country}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Your name</label>
          <input
            value={info.fullName}
            onChange={(e) => setInfo((v) => ({ ...v, fullName: e.target.value }))}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.fullName && <p className="mt-1 text-[11px] text-red">{errors.fullName}</p>}
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Email</label>
          <input
            type="email"
            value={info.email}
            onChange={(e) => setInfo((v) => ({ ...v, email: e.target.value }))}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.email && <p className="mt-1 text-[11px] text-red">{errors.email}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">Password</label>
            <input
              type="password"
              value={info.password}
              onChange={(e) => setInfo((v) => ({ ...v, password: e.target.value }))}
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
            />
            {errors.password && <p className="mt-1 text-[11px] text-red">{errors.password}</p>}
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">Confirm password</label>
            <input
              type="password"
              value={info.confirmPassword}
              onChange={(e) => setInfo((v) => ({ ...v, confirmPassword: e.target.value }))}
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
            />
            {errors.confirmPassword && <p className="mt-1 text-[11px] text-red">{errors.confirmPassword}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110"
        >
          Continue to payment
        </button>
      </form>
    </>
  );
}
