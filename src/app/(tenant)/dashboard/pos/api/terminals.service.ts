import { apiGet, apiSend } from "@/lib/api/envelope";
import type { NewPosTerminalInput, PosTerminal } from "../types";
import {
  mapTerminal,
  toApiTerminalCreate,
  toApiTerminalUpdate,
  type ApiPosTerminal,
} from "./mappers";

export const posTerminalsApi = {
  list: async (): Promise<PosTerminal[]> => {
    const rows = await apiGet<ApiPosTerminal[]>("/pos/terminals");
    return rows.map(mapTerminal);
  },

  get: async (id: string): Promise<PosTerminal | undefined> => {
    const rows = await posTerminalsApi.list();
    return rows.find((t) => t.id === id);
  },

  create: async (input: NewPosTerminalInput): Promise<PosTerminal> => {
    const row = await apiSend<ApiPosTerminal>("post", "/pos/terminals", toApiTerminalCreate(input));
    return mapTerminal(row);
  },

  update: async (id: string, input: NewPosTerminalInput): Promise<void> => {
    await apiSend("patch", `/pos/terminals/${id}`, toApiTerminalUpdate(input));
  },

  setStatus: async (id: string, status: PosTerminal["status"]): Promise<void> => {
    await apiSend("patch", `/pos/terminals/${id}`, {
      status: status === "active" ? "ACTIVE" : "INACTIVE",
    });
  },
};
