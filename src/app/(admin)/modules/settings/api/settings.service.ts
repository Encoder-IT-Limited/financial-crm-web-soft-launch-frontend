import { apiGet, apiSend } from "@/lib/api/envelope";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import type { PlatformSettings } from "../types";

type ApiSettings = {
  platformName: string;
  primaryColor?: string | null;
  retentionDays?: number;
  seatLimitMessage?: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  contactEmail?: string | null;
  currency?: string | null;
  privacyBody?: string | null;
  termsBody?: string | null;
  privacyLastUpdated?: string | null;
  termsLastUpdated?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  instagram?: string | null;
};

function mergeSettings(api: ApiSettings): PlatformSettings {
  return {
    general: {
      platformName: api.platformName || PLATFORM_SETTINGS.general.platformName,
      logoUrl: api.logoUrl ?? PLATFORM_SETTINGS.general.logoUrl,
      tagline: api.tagline ?? PLATFORM_SETTINGS.general.tagline,
      contactEmail: api.contactEmail ?? PLATFORM_SETTINGS.general.contactEmail,
      currency: (api.currency ?? PLATFORM_SETTINGS.general.currency).toUpperCase(),
      maintenanceEnabled: api.maintenanceMode,
      maintenanceMessage: api.maintenanceMessage ?? PLATFORM_SETTINGS.general.maintenanceMessage,
    },
    legal: {
      privacyBody: api.privacyBody ?? PLATFORM_SETTINGS.legal.privacyBody,
      termsBody: api.termsBody ?? PLATFORM_SETTINGS.legal.termsBody,
      privacyLastUpdated: api.privacyLastUpdated ?? PLATFORM_SETTINGS.legal.privacyLastUpdated,
      termsLastUpdated: api.termsLastUpdated ?? PLATFORM_SETTINGS.legal.termsLastUpdated,
    },
    socialLinks: {
      linkedin: api.linkedin ?? PLATFORM_SETTINGS.socialLinks.linkedin,
      twitter: api.twitter ?? PLATFORM_SETTINGS.socialLinks.twitter,
      instagram: api.instagram ?? PLATFORM_SETTINGS.socialLinks.instagram,
    },
  };
}

function stampLegalDate() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const settingsApi = {
  get: async (): Promise<PlatformSettings> => mergeSettings(await apiGet<ApiSettings>("/admin/settings")),

  update: async (settings: PlatformSettings): Promise<PlatformSettings> =>
    mergeSettings(
      await apiSend<ApiSettings>("patch", "/admin/settings", {
        platformName: settings.general.platformName,
        tagline: settings.general.tagline,
        logoUrl: settings.general.logoUrl || null,
        contactEmail: settings.general.contactEmail,
        currency: settings.general.currency,
        maintenanceMode: settings.general.maintenanceEnabled,
        maintenanceMessage: settings.general.maintenanceMessage,
        privacyBody: settings.legal.privacyBody,
        termsBody: settings.legal.termsBody,
        privacyLastUpdated: stampLegalDate(),
        termsLastUpdated: stampLegalDate(),
        linkedin: settings.socialLinks.linkedin || null,
        twitter: settings.socialLinks.twitter || null,
        instagram: settings.socialLinks.instagram || null,
      }),
    ),

  updateGeneral: async (settings: PlatformSettings["general"]): Promise<PlatformSettings> =>
    mergeSettings(
      await apiSend<ApiSettings>("patch", "/admin/settings", {
        platformName: settings.platformName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl || null,
        contactEmail: settings.contactEmail,
        currency: settings.currency,
        maintenanceMode: settings.maintenanceEnabled,
        maintenanceMessage: settings.maintenanceMessage,
      }),
    ),
};
