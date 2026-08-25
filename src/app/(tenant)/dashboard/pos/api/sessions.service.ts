import { newId } from "@/lib/format";
import type { NewPosSessionInput, PosSession } from "../types";
import { expectedCashForSession, round2 } from "../types";
import { seedSessions } from "../mock/seed";
import { posSalesApi } from "./sales.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

let sessions: PosSession[] = seedSessions;

export const posSessionsApi = {
  list: async (): Promise<PosSession[]> => {
    await delay(200);
    return sessions;
  },

  get: async (id: string): Promise<PosSession | undefined> => {
    await delay(150);
    return sessions.find((s) => s.id === id);
  },

  /** The currently open session for a terminal, if any — a terminal
   * can only have one open session at a time (client-confirmed: one
   * physical drawer, one owner at a time). */
  getOpenForTerminal: async (terminalId: string): Promise<PosSession | undefined> => {
    await delay(150);
    return sessions.find((s) => s.terminalId === terminalId && s.status === "open");
  },

  open: async (input: NewPosSessionInput): Promise<PosSession> => {
    await delay();
    const session: PosSession = {
      id: newId("sess"),
      terminalId: input.terminalId,
      openedBy: input.openedBy,
      openedAt: new Date().toISOString(),
      openingCash: round2(input.openingCash),
      status: "open",
    };
    sessions = [session, ...sessions];
    return session;
  },

  close: async (id: string, closingCashCounted: number): Promise<void> => {
    await delay();
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    const [sales, refunds] = await Promise.all([posSalesApi.list(), posSalesApi.listRefunds()]);
    const expected = expectedCashForSession(session, sales, refunds);
    sessions = sessions.map((s) =>
      s.id === id
        ? {
            ...s,
            status: "closed",
            closedAt: new Date().toISOString(),
            closingCashCounted: round2(closingCashCounted),
            expectedCash: expected,
            variance: round2(closingCashCounted - expected),
          }
        : s
    );
  },
};
