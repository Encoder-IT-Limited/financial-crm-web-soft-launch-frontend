import { pageMetadata } from "@/lib/seo";
import { PricingCalculator } from "./components/pricing-calculator";
import { ComparisonTable } from "./components/comparison-table";
import { PricingFaq } from "./components/pricing-faq";
import { PricingJsonLd } from "./components/pricing-json-ld";
import { FinalCtaBanner } from "../components/final-cta-banner";
import { PLANS } from "../components/plans-data";

export const metadata = pageMetadata({
  title: "Pricing",
  description:
    "Transparent pricing for every team size. Free trial, no hidden fees — compare modules and seats.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <PricingJsonLd />
      <main className="relative overflow-hidden px-5 pt-16 pb-20 sm:px-8 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-140px] left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-blue/10 blur-[120px]"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-5xl xl:text-[52px] 3xl:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-[13.5px] text-text-3 sm:text-[15px] xl:text-base 3xl:text-lg">
            Choose a plan that scales with your team. 14-day free trial · No hidden fees ·
            Cancel anytime.
          </p>
        </div>

        {/* Server-rendered plan summary for crawlers; calculator hydrates below. */}
        <ul className="sr-only">
          {PLANS.map((plan) => (
            <li key={plan.id}>
              {plan.name}: AED {plan.priceMonthly}/month or AED {plan.priceYearly}/year ·{" "}
              {plan.baseSeats} seats included · {plan.modules.join(", ")}
            </li>
          ))}
        </ul>

        <div className="relative mt-12">
          <PricingCalculator />
        </div>
      </main>

      <section className="border-t border-border bg-surface-subtle px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-extrabold text-text sm:text-2xl xl:text-[28px] 3xl:text-3xl">
            Compare plans
          </h2>
          <p className="mt-2 text-[13px] text-text-3 xl:text-sm 3xl:text-base">
            Every module, side by side.
          </p>
        </div>
        <div className="mt-10">
          <ComparisonTable />
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-bold tracking-wide text-blue uppercase xl:text-xs">
            How to get started
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-text sm:text-2xl xl:text-[28px] 3xl:text-3xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10">
          <PricingFaq />
        </div>
      </section>

      <FinalCtaBanner
        title="Ready to choose your plan?"
        subtitle="14-day free trial, no credit card required."
      />
    </>
  );
}
