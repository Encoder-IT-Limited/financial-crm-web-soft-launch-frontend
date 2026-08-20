import { LegalPage } from "../components/legal-page";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={PLATFORM_SETTINGS.legal.privacyLastUpdated}>
      {/* Admin-authored content from Settings → Site & legal, not user input. */}
      <div dangerouslySetInnerHTML={{ __html: PLATFORM_SETTINGS.legal.privacyBody }} />
    </LegalPage>
  );
}
