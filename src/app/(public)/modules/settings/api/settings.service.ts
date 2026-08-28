import { apiGet } from "@/lib/api/envelope";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import type { PlatformSettings } from "@/app/(admin)/modules/settings/types";

export type PublicSettings = {
  platformName: string;
  logoUrl: string;
  tagline: string;
  contactEmail: string;
  currency: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  privacyBody: string;
  termsBody: string;
  privacyLastUpdated: string;
  termsLastUpdated: string;
  socialLinks: {
    linkedin: string;
    twitter: string;
    instagram: string;
  };
};

export function fallbackPublicSettings(): PublicSettings {
  return {
    platformName: PLATFORM_SETTINGS.general.platformName,
    logoUrl: PLATFORM_SETTINGS.general.logoUrl,
    tagline: PLATFORM_SETTINGS.general.tagline,
    contactEmail: PLATFORM_SETTINGS.general.contactEmail,
    currency: PLATFORM_SETTINGS.general.currency,
    maintenanceMode: PLATFORM_SETTINGS.general.maintenanceEnabled,
    maintenanceMessage: PLATFORM_SETTINGS.general.maintenanceMessage,
    privacyBody: PLATFORM_SETTINGS.legal.privacyBody,
    termsBody: PLATFORM_SETTINGS.legal.termsBody,
    privacyLastUpdated: PLATFORM_SETTINGS.legal.privacyLastUpdated,
    termsLastUpdated: PLATFORM_SETTINGS.legal.termsLastUpdated,
    socialLinks: PLATFORM_SETTINGS.socialLinks,
  };
}

export function toPlatformSettings(row: PublicSettings): PlatformSettings {
  return {
    general: {
      platformName: row.platformName,
      logoUrl: row.logoUrl ?? "",
      tagline: row.tagline ?? "",
      contactEmail: row.contactEmail ?? "",
      currency: (row.currency ?? "AED").toUpperCase(),
      maintenanceEnabled: row.maintenanceMode,
      maintenanceMessage: row.maintenanceMessage ?? "",
    },
    legal: {
      privacyBody: row.privacyBody,
      termsBody: row.termsBody,
      privacyLastUpdated: row.privacyLastUpdated,
      termsLastUpdated: row.termsLastUpdated,
    },
    socialLinks: row.socialLinks,
  };
}

export const publicSettingsApi = {
  get: () => apiGet<PublicSettings>("/settings"),
};
