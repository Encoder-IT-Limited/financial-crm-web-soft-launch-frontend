import { LegalPage } from "../components/legal-page";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: `Privacy Policy for ${PLATFORM_SETTINGS.general.platformName} — how we collect, use, and isolate tenant data.`,
  path: "/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={PLATFORM_SETTINGS.legal.privacyLastUpdated}>
      {/* Admin-authored content from Settings → Site & legal, not user input. */}
      <div dangerouslySetInnerHTML={{ __html: PLATFORM_SETTINGS.legal.privacyBody }} />
    </LegalPage>
  );
}
