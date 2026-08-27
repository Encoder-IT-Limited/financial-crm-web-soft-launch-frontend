"use client";

import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { apiSend } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  company: z.string().optional(),
  message: z.string().min(10, "Tell us a bit more (at least 10 characters)"),
});

type FormValues = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { name: "", email: "", company: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await apiSend("post", "/contact", {
        name: result.data.name,
        email: result.data.email,
        company: result.data.company || undefined,
        message: result.data.message,
      });
      setSubmitted(true);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Couldn't send your message. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-10 text-green" />
        <p className="text-[14px] font-semibold text-text">Message sent</p>
        <p className="text-[12.5px] text-text-3">
          Thanks for reaching out — we&apos;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Name</label>
          <input
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.name && <p className="mt-1 text-[11px] text-red">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.email && <p className="mt-1 text-[11px] text-red">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold text-text-2">
          Company <span className="text-text-4">(optional)</span>
        </label>
        <input
          value={values.company}
          onChange={(e) => setField("company", e.target.value)}
          className="w-full rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-blue"
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-semibold text-text-2">Message</label>
        <textarea
          rows={4}
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          className="w-full resize-none rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-blue"
        />
        {errors.message && <p className="mt-1 text-[11px] text-red">{errors.message}</p>}
      </div>

      {formError && <p className="text-[12px] text-red">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
