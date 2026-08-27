import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { pageMetadata } from "@/lib/seo";
import { TermsOfServiceContent } from "./terms-content";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: `Terms of Service for ${PLATFORM_SETTINGS.general.platformName} — subscription, seats, billing, and account responsibilities.`,
  path: "/terms",
});

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />;
}
