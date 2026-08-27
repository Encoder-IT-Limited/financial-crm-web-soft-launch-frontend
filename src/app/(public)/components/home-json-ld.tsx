"use client";

import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { PLANS } from "@/app/(public)/components/plans-data";
import { usePublicPlans } from "../modules/plans/hooks/use-public-plans";
import { usePlatformCurrency, usePublicSettings } from "../modules/settings/hooks/use-public-settings";

/** JSON-LD for the marketing homepage — helps search engines understand the product. */
export function HomeJsonLd() {
  const { data: settings } = usePublicSettings();
  const { data: livePlans } = usePublicPlans();
  const currency = usePlatformCurrency();
  const brand = settings?.platformName ?? "MRM Portal";
  const site = getSiteUrl();
  const plans = livePlans?.length ? livePlans : PLANS;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand,
    url: site,
    email: settings?.contactEmail ?? "",
    description: settings?.tagline ?? "",
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: site,
    description:
      "Multi-tenant accounting, invoicing, inventory, banking, and CRM platform for growing businesses.",
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: currency,
      url: absoluteUrl("/pricing"),
    })),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand,
    url: site,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
