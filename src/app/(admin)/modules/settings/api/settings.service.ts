import { apiGet, apiSend } from "@/lib/api/envelope";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import type { PlatformSettings } from "../types";

type ApiSettings = {
  platformName: string;
  primaryColor: string | null;
  retentionDays: number;
  seatLimitMessage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
};

function mergeSettings(api: ApiSettings): PlatformSettings {
  return {
    ...PLATFORM_SETTINGS,
    general: {
      ...PLATFORM_SETTINGS.general,
      platformName: api.platformName,
      maintenanceEnabled: api.maintenanceMode,
      maintenanceMessage: api.maintenanceMessage ?? PLATFORM_SETTINGS.general.maintenanceMessage,
    },
  };
}

export const settingsApi = {
  get: async (): Promise<PlatformSettings> => mergeSettings(await apiGet<ApiSettings>("/admin/settings")),

  updateGeneral: async (settings: PlatformSettings["general"]): Promise<PlatformSettings> =>
    mergeSettings(
      await apiSend<ApiSettings>("patch", "/admin/settings", {
        platformName: settings.platformName,
        maintenanceMode: settings.maintenanceEnabled,
        maintenanceMessage: settings.maintenanceMessage,
      }),
    ),
};
