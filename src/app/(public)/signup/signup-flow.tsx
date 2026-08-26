"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "../components/auth-shell";
import { AuthStepsList, type AuthStep } from "../components/auth-steps-list";
import { PlanStep } from "./plan-step";
import { InfoStep, type InfoValues } from "./info-step";
import { PaymentStep, type PaymentValues } from "./payment-step";
import { signupService } from "../modules/signup/api/signup.service";
import { usePublicPlans } from "../modules/plans/hooks/use-public-plans";
import { ApiError } from "@/lib/api/errors";
import type { Plan } from "@/types/plan";

const emptyInfo: InfoValues = {
  companyName: "",
  country: "",
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type SignupFlowProps = {
  /** Resolved server-side from the ?plan= query param (page.tsx) — reading
   * it there instead of via useSearchParams() means AuthShell doesn't need
   * a client-only Suspense gate, so it renders immediately. */
  initialPlanId?: string;
};

export function SignupFlow({ initialPlanId }: SignupFlowProps) {
  const { data: plans = [] } = usePublicPlans();
  const preselectedPlan = plans.find((p) => p.id === initialPlanId) ?? null;
  const hasPlanStep = !preselectedPlan;

  const steps: AuthStep[] = hasPlanStep
    ? [
        { key: "plan", label: "Choose a plan", description: "Pick what fits your team" },
        { key: "info", label: "Your details", description: "Company & account info" },
        { key: "payment", label: "Payment", description: "Start your free trial" },
      ]
    : [
        { key: "info", label: "Your details", description: "Company & account info" },
        { key: "payment", label: "Payment", description: "Start your free trial" },
      ];

  const [stepIndex, setStepIndex] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(preselectedPlan);
  const [info, setInfo] = useState<InfoValues>(emptyInfo);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!plan && preselectedPlan) setPlan(preselectedPlan);

  const step = steps[stepIndex].key;

  function selectPlan(next: Plan) {
    setPlan(next);
    setStepIndex(1);
  }

  function handleInfoSubmit(values: InfoValues) {
    setInfo(values);
    setStepIndex((i) => i + 1);
  }

  // Card details aren't sent anywhere real yet — no payment gateway wired
  // up, see payment-step.tsx.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handlePaymentSubmit(payment: PaymentValues) {
    if (!plan) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const me = await signupService.create({
        planId: plan.id,
        company: { name: info.companyName, country: info.country },
        owner: { name: info.fullName, email: info.email, password: info.password },
      });
      queryClient.setQueryData(["me"], me);
      router.push(me.realm === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Couldn't complete payment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    if (stepIndex === 0) {
      router.push("/pricing");
      return;
    }
    setStepIndex((i) => i - 1);
  }

  return (
    <AuthShell
      leftFooter={<AuthStepsList steps={steps} currentIndex={stepIndex} />}
      contentClassName={step === "plan" ? "max-w-sm" : "max-w-md"}
    >
      <button
        type="button"
        onClick={goBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-3 hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      {step === "plan" && <PlanStep selectedId={plan?.id} onSelect={selectPlan} />}
      {step === "info" && (
        <InfoStep planName={plan?.name} defaultValues={info} onSubmit={handleInfoSubmit} />
      )}
      {step === "payment" && plan && (
        <PaymentStep plan={plan} submitting={submitting} formError={formError} onSubmit={handlePaymentSubmit} />
      )}

      <p className="mt-6 text-center text-[12.5px] text-text-3">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
