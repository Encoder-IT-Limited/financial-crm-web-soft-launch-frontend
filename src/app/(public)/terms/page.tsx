import { LegalPage } from "../components/legal-page";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: `Terms of Service for ${PLATFORM_SETTINGS.general.platformName} — subscription, seats, billing, and account responsibilities.`,
  path: "/terms",
});

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={PLATFORM_SETTINGS.legal.termsLastUpdated}>
      {/* Admin-authored content from Settings → Site & legal, not user input. */}
      <div dangerouslySetInnerHTML={{ __html: PLATFORM_SETTINGS.legal.termsBody }} />
    </LegalPage>
  );
}
