import { LegalPage } from "../components/legal-page";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={PLATFORM_SETTINGS.legal.termsLastUpdated}>
      {/* Admin-authored content from Settings → Site & legal, not user input. */}
      <div dangerouslySetInnerHTML={{ __html: PLATFORM_SETTINGS.legal.termsBody }} />
    </LegalPage>
  );
}
