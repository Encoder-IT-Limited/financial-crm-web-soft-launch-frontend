import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { pageMetadata } from "@/lib/seo";
import { PrivacyPolicyContent } from "./privacy-content";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: `Privacy Policy for ${PLATFORM_SETTINGS.general.platformName} — how we collect, use, and isolate tenant data.`,
  path: "/privacy",
});

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
