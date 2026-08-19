import { LegalPage } from "../components/legal-page";

// PLACEHOLDER — generic draft copy pending real legal review, not the final
// terms. Structure/sections match a typical multi-tenant SaaS agreement;
// content should be replaced before launch.
export default function TermsOfServicePage() {
  return (
    <>
      <LegalPage title="Terms of Service" lastUpdated="Draft — not yet published">
        <p>
          This is a placeholder Terms of Service. It outlines, in general terms, the
          agreement between MRM Portal and its customers — the final text will be
          reviewed and provided by legal before launch.
        </p>

        <h2>The service</h2>
        <p>
          MRM Portal provides a subscription-based business management platform.
          Availability of specific modules depends on your subscription plan.
        </p>

        <h2>Accounts and seats</h2>
        <p>
          Your plan includes a base number of user seats; additional seats may be
          purchased. You are responsible for activity under accounts created within your
          organization.
        </p>

        <h2>Subscription and payment</h2>
        <p>
          Subscriptions renew on the billing cycle you select. If a subscription lapses,
          your account moves to a read-only state — existing data remains viewable and
          exportable, but new transactions cannot be created until payment is resolved.
        </p>

        <h2>Data ownership</h2>
        <p>
          You retain ownership of the business data you enter into the platform. MRM
          Portal acts as a processor of that data on your behalf.
        </p>

        <h2>Termination</h2>
        <p>
          Either party may terminate the subscription per the terms of your plan. Data is
          retained for a defined grace period after termination before deletion.
        </p>

        <h2>Contact</h2>
        <p>Questions about these terms can be directed to MRM Portal support.</p>
      </LegalPage>
    </>
  );
}
