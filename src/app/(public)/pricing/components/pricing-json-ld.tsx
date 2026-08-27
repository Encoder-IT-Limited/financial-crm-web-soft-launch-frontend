"use client";

import { PLANS } from "@/app/(public)/components/plans-data";
import { absoluteUrl } from "@/lib/seo";
import { usePublicPlans } from "@/app/(public)/modules/plans/hooks/use-public-plans";
import { usePlatformCurrency } from "@/app/(public)/modules/settings/hooks/use-public-settings";

const FAQS = [
  {
    q: "What happens if I go over my included seats?",
    a: "Every active-login user counts toward your seat limit. If you try to add a user beyond your plan's seat count, creation is blocked and you are prompted to upgrade.",
  },
  {
    q: "What happens if my subscription lapses?",
    a: "Your account moves to a read-only state immediately. You can still log in, view, and export data, but cannot create new transactions until payment is resolved.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes — upgrade or downgrade anytime as your team grows. Seat count and active modules update immediately.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Yes — every plan includes a free trial, no credit card required.",
  },
];

/** Crawlable FAQ + Offer schema for /pricing. */
export function PricingJsonLd() {
  const { data: livePlans } = usePublicPlans();
  const currency = usePlatformCurrency();
  const plans = livePlans?.length ? livePlans : PLANS;

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "MRM Portal subscription",
    description: `Multi-tenant accounting and operations platform plans priced in ${currency}.`,
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: currency,
      url: absoluteUrl("/pricing"),
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />
    </>
  );
}
