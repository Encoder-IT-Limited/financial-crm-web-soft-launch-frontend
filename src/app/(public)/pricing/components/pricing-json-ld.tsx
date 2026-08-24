import { PLANS } from "@/app/(public)/components/plans-data";
import { absoluteUrl } from "@/lib/seo";

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
    description: "Multi-tenant accounting and operations platform plans priced in AED.",
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: "AED",
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
