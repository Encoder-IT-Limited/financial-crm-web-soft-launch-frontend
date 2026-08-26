import { apiGet, apiSend } from "@/lib/api/envelope";
import type { NewPosSessionInput, PosSession } from "../types";
import { mapSession, type ApiPosSession } from "./mappers";

export const posSessionsApi = {
  list: async (): Promise<PosSession[]> => {
    const rows = await apiGet<ApiPosSession[]>("/pos/sessions");
    return rows.map(mapSession);
  },

  get: async (id: string): Promise<PosSession> => {
    const row = await apiGet<ApiPosSession>(`/pos/sessions/${id}`);
    return mapSession(row);
  },

  getOpenForTerminal: async (terminalId: string): Promise<PosSession | undefined> => {
    try {
      const row = await apiGet<ApiPosSession>(`/pos/terminals/${terminalId}/open-session`);
      return mapSession(row);
    } catch {
      return undefined;
    }
  },

  open: async (
    input: NewPosSessionInput & { accessCode: string },
  ): Promise<PosSession> => {
    const row = await apiSend<ApiPosSession>("post", "/pos/sessions", {
      terminalId: input.terminalId,
      openingCash: input.openingCash,
      accessCode: input.accessCode,
      cashierName: input.openedBy,
    });
    return mapSession(row);
  },

  close: async (id: string, closingCashCounted: number): Promise<PosSession> => {
    const row = await apiSend<ApiPosSession>("post", `/pos/sessions/${id}/close`, {
      closingCash: closingCashCounted,
    });
    return mapSession(row);
  },
};
