import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const brand = PLATFORM_SETTINGS.general.platformName;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${brand} — Accounting, inventory & CRM in one place`,
    template: `%s | ${brand}`,
  },
  description:
    PLATFORM_SETTINGS.general.tagline ||
    "Multi-tenant accounting, invoicing, inventory, banking, and CRM for growing teams.",
  applicationName: brand,
  keywords: [
    "accounting software UAE",
    "inventory management",
    "invoicing",
    "VAT",
    "CRM",
    "multi-tenant ERP",
    brand,
  ],
  authors: [{ name: brand }],
  creator: brand,
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: brand,
    title: `${brand} — Accounting, inventory & CRM in one place`,
    description: PLATFORM_SETTINGS.general.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: brand,
    description: PLATFORM_SETTINGS.general.tagline,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// System font stack per docs/Project-Structure.md §2.2 — matches the client's
// prototype exactly, no webfont dependency.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
