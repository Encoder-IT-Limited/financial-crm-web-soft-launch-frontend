import type { PlatformSettings } from "@/app/(admin)/modules/settings/types";

// TEMPORARY: no backend/settingsService yet (see docs/Public-SuperAdmin-Plan.md
// §3.5). This is the single source both (admin)'s Settings page and (public)'s
// navbar/footer/legal pages read from, the same pattern plans-data.ts used
// before Plans & Pricing existed. Editing it here is the only way to change
// site copy until a real settings API exists — the admin Settings page can't
// persist back to this file at runtime.
export const PLATFORM_SETTINGS: PlatformSettings = {
  general: {
    platformName: "MRM Portal",
    logoUrl: "",
    tagline: "Run your business finances in one place.",
    contactEmail: "support@mrmportal.com",
    maintenanceEnabled: false,
    maintenanceMessage: "MRM Portal is undergoing scheduled maintenance. We'll be back shortly.",
  },
  legal: {
    privacyBody: `
      <p>This is a placeholder Privacy Policy. It describes, in outline, the kinds of information MRM Portal collects and how it is used — the final text will be reviewed and provided by legal before launch.</p>
      <h2>Information we collect</h2>
      <p>Account and company details you provide at signup; usage data generated as you use the product (transactions, records, files you upload); and technical data such as IP address and device information for security and support purposes.</p>
      <h2>How we use it</h2>
      <p>To provide and operate the service, secure your account, respond to support requests, and meet legal/regulatory obligations relevant to your jurisdiction.</p>
      <h2>Data isolation</h2>
      <p>Each tenant's business data is logically isolated from every other tenant. Platform staff access tenant data only as needed for support, billing, or legal compliance.</p>
      <h2>Data retention</h2>
      <p>Data is retained for the duration of an active subscription. If a subscription lapses, data is retained for a defined grace period before deletion — see your plan terms for specifics.</p>
      <h2>Contact</h2>
      <p>Questions about this policy can be directed to MRM Portal support.</p>
    `.trim(),
    termsBody: `
      <p>This is a placeholder Terms of Service. It outlines, in general terms, the agreement between MRM Portal and its customers — the final text will be reviewed and provided by legal before launch.</p>
      <h2>The service</h2>
      <p>MRM Portal provides a subscription-based business management platform. Availability of specific modules depends on your subscription plan.</p>
      <h2>Accounts and seats</h2>
      <p>Your plan includes a base number of user seats; additional seats may be purchased. You are responsible for activity under accounts created within your organization.</p>
      <h2>Subscription and payment</h2>
      <p>Subscriptions renew on the billing cycle you select. If a subscription lapses, your account moves to a read-only state — existing data remains viewable and exportable, but new transactions cannot be created until payment is resolved.</p>
      <h2>Data ownership</h2>
      <p>You retain ownership of the business data you enter into the platform. MRM Portal acts as a processor of that data on your behalf.</p>
      <h2>Termination</h2>
      <p>Either party may terminate the subscription per the terms of your plan. Data is retained for a defined grace period after termination before deletion.</p>
      <h2>Contact</h2>
      <p>Questions about these terms can be directed to MRM Portal support.</p>
    `.trim(),
    privacyLastUpdated: "Draft — not yet published",
    termsLastUpdated: "Draft — not yet published",
  },
  // Built for §3.5's "Site & legal" tab but intentionally not rendered in
  // PublicFooter yet — §2.4 (decided 2026-08-19) explicitly cut social icons
  // from the footer ("nothing in the proposal or prototype calls for them").
  // Wire this in only once that decision is revisited.
  socialLinks: {
    linkedin: "",
    twitter: "",
    instagram: "",
  },
};
