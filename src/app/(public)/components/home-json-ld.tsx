import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { PLANS } from "@/app/(public)/components/plans-data";

/** JSON-LD for the marketing homepage — helps search engines understand the product. */
export function HomeJsonLd() {
  const brand = PLATFORM_SETTINGS.general.platformName;
  const site = getSiteUrl();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand,
    url: site,
    email: PLATFORM_SETTINGS.general.contactEmail,
    description: PLATFORM_SETTINGS.general.tagline,
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: site,
    description:
      "Multi-tenant accounting, invoicing, inventory, banking, and CRM platform for growing businesses in the UAE.",
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: "AED",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
