import type { Metadata } from "next";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";

const brand = PLATFORM_SETTINGS.general.platformName;

/** Absolute origin for canonical URLs, sitemap, and Open Graph. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (domain && domain !== "localhost" && domain !== "127.0.0.1") {
    return `https://${domain}`;
  }

  return "http://localhost:3001";
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized === "/" ? "" : normalized}`;
}

type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  /** Marketing pages default to indexable; auth/app flows should pass false. */
  index?: boolean;
};

/** Shared metadata for public marketing pages (and noindex helpers for auth). */
export function pageMetadata({ title, description, path, index = true }: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(brand) ? title : title;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title: `${fullTitle} | ${brand}`,
      description,
      url,
      siteName: brand,
      locale: "en_AE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullTitle} | ${brand}`,
      description,
    },
  };
}

export function authPageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
  };
}
