"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { z } from "zod";
import type { Plan } from "@/types/plan";

const paymentSchema = z.object({
  cardName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().regex(/^\d{16}$/, "Enter a 16-digit card number"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "MM/YY"),
  cvc: z.string().regex(/^\d{3,4}$/, "Enter a valid CVC"),
});

export type PaymentValues = z.infer<typeof paymentSchema>;
type PaymentErrors = Partial<Record<keyof PaymentValues, string>>;

const emptyPayment: PaymentValues = { cardName: "", cardNumber: "", expiry: "", cvc: "" };

type PaymentStepProps = {
  plan: Plan;
  submitting: boolean;
  formError: string | null;
  onSubmit: (values: PaymentValues) => void;
};

export function PaymentStep({ plan, submitting, formError, onSubmit }: PaymentStepProps) {
  const [payment, setPayment] = useState<PaymentValues>(emptyPayment);
  const [errors, setErrors] = useState<PaymentErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = paymentSchema.safeParse(payment);
    if (!result.success) {
      const fieldErrors: PaymentErrors = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as keyof PaymentValues] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-text">Add payment details</h1>
      <p className="mt-1.5 text-[13px] text-text-3">Your trial starts today — you won&apos;t be charged yet.</p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-surface-subtle px-4 py-3 text-[12.5px]">
        <span className="text-text-3">{plan.name} plan</span>
        <span className="font-semibold text-text">
          {plan.priceMonthly > 0 ? `AED ${plan.priceMonthly.toLocaleString()}/mo` : "Custom"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Cardholder name</label>
          <input
            value={payment.cardName}
            onChange={(e) => setPayment((v) => ({ ...v, cardName: e.target.value }))}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.cardName && <p className="mt-1 text-[11px] text-red">{errors.cardName}</p>}
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-text-2">Card number</label>
          <input
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            maxLength={16}
            value={payment.cardNumber}
            onChange={(e) => setPayment((v) => ({ ...v, cardNumber: e.target.value.replace(/\D/g, "") }))}
            className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
          />
          {errors.cardNumber && <p className="mt-1 text-[11px] text-red">{errors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">Expiry</label>
            <input
              placeholder="MM/YY"
              maxLength={5}
              value={payment.expiry}
              onChange={(e) => setPayment((v) => ({ ...v, expiry: e.target.value }))}
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
            />
            {errors.expiry && <p className="mt-1 text-[11px] text-red">{errors.expiry}</p>}
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text-2">CVC</label>
            <input
              inputMode="numeric"
              maxLength={4}
              value={payment.cvc}
              onChange={(e) => setPayment((v) => ({ ...v, cvc: e.target.value.replace(/\D/g, "") }))}
              className="w-full rounded-[7px] border border-border bg-surface px-3 py-2.5 text-[13px] text-text outline-none focus:border-blue"
            />
            {errors.cvc && <p className="mt-1 text-[11px] text-red">{errors.cvc}</p>}
          </div>
        </div>

        {formError && <p className="text-[12px] text-red">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          <Lock className="size-3.5" />
          {submitting ? "Processing..." : "Pay & create account"}
        </button>
      </form>
    </>
  );
}
