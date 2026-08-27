"use client";

import { useQuery } from "@tanstack/react-query";
import { fallbackPublicSettings, publicSettingsApi } from "../api/settings.service";

export function usePublicSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: publicSettingsApi.get,
    placeholderData: fallbackPublicSettings(),
    staleTime: 30_000,
  });
}

export function usePlatformCurrency() {
  const { data } = usePublicSettings();
  return (data?.currency ?? "AED").toUpperCase();
}
