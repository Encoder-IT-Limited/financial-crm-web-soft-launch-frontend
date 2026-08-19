import Link from "next/link";
import { PlanCard } from "../components/plan-card";
import { PLANS } from "../components/plans-data";

export default function PricingPage() {
  return (
    <>

      <main className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden px-5 py-14 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-140px] left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-blue/10 blur-[120px]"
        />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Plans & pricing</h1>
          <p className="mt-2 text-[13px] text-text-3">
            Every plan includes the full accounting core. Add seats as your team grows.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              cta={
                <Link
                  href={plan.id === "enterprise" ? "/contact" : `/signup?plan=${plan.id}`}
                  className="block rounded-lg bg-blue px-4 py-2 text-[12.5px] font-semibold text-white hover:brightness-110"
                >
                  {plan.id === "enterprise" ? "Contact sales" : `Choose ${plan.name}`}
                </Link>
              }
            />
          ))}
        </div>
      </main>

    </>
  );
}
