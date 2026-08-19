"use client";

import { useState } from "react";
import { z } from "zod";
import { Mail, CheckCircle2 } from "lucide-react";
import { PublicNavbar } from "../components/public-navbar";
import { PublicFooter } from "../components/public-footer";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  company: z.string().optional(),
  message: z.string().min(10, "Tell us a bit more (at least 10 characters)"),
});

type FormValues = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { name: "", email: "", company: "", message: "" };

export default function ContactPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    setSubmitting(true);
    // TEMPORARY: no backend/contact service yet — simulates a submit so the
    // form is usable end-to-end. Wire to a real endpoint once one exists.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <>
      <PublicNavbar />

      <main className="flex min-h-[90vh] flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid w-full max-w-4xl gap-10 sm:grid-cols-[1fr_1.4fr] sm:items-start">
          <div>
            <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Get in touch</h1>
            <p className="mt-3 text-[13.5px] text-text-3">
              Questions about plans, modules, or your account — send us a message and we&apos;ll
              get back to you.
            </p>

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-l text-blue">
                <Mail className="size-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-text-4 uppercase">Email</div>
                {/* PLACEHOLDER — replace with the real support address before launch */}
                <div className="text-[13px] font-medium text-text">support@mrmportal.com</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="size-10 text-green" />
                <p className="text-[14px] font-semibold text-text">Message sent</p>
                <p className="text-[12.5px] text-text-3">
                  Thanks for reaching out — we&apos;ll get back to you shortly.
                </p>
              </div>
            ) : (
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
