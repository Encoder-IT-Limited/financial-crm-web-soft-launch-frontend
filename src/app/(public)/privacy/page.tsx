import { PublicNavbar } from "../components/public-navbar";
import { PublicFooter } from "../components/public-footer";
import { LegalPage } from "../components/legal-page";

// PLACEHOLDER — generic draft copy pending real legal review, not the final
// policy. Structure/sections match what a multi-tenant SaaS handling
// financial data will need; content should be replaced before launch.
export default function PrivacyPolicyPage() {
  return (
    <>
      <PublicNavbar />
      <LegalPage title="Privacy Policy" lastUpdated="Draft — not yet published">
        <p>
          This is a placeholder Privacy Policy. It describes, in outline, the kinds of
          information MRM Portal collects and how it is used — the final text will be
          reviewed and provided by legal before launch.
        </p>

        <h2>Information we collect</h2>
        <p>
          Account and company details you provide at signup; usage data generated as you
          use the product (transactions, records, files you upload); and technical data
          such as IP address and device information for security and support purposes.
        </p>

        <h2>How we use it</h2>
        <p>
          To provide and operate the service, secure your account, respond to support
          requests, and meet legal/regulatory obligations relevant to your jurisdiction.
        </p>

        <h2>Data isolation</h2>
        <p>
          Each tenant&apos;s business data is logically isolated from every other tenant.
          Platform staff access tenant data only as needed for support, billing, or legal
          compliance.
        </p>

        <h2>Data retention</h2>
        <p>
          Data is retained for the duration of an active subscription. If a subscription
          lapses, data is retained for a defined grace period before deletion — see your
          plan terms for specifics.
        </p>

        <h2>Contact</h2>
        <p>Questions about this policy can be directed to MRM Portal support.</p>
      </LegalPage>
      <PublicFooter />
    </>
  );
}
