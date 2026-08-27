import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { pageMetadata } from "@/lib/seo";
import { ContactPageContent } from "./contact-page-content";

export const metadata = pageMetadata({
  title: "Contact",
  description: `Questions about plans, modules, or your account? Contact ${PLATFORM_SETTINGS.general.platformName} at ${PLATFORM_SETTINGS.general.contactEmail}.`,
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageContent />;
}
