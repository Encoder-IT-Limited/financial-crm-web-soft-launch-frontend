import { newId } from "@/lib/format";
import type { NewPosTerminalInput, PosTerminal } from "../types";
import { seedTerminals } from "../mock/seed";

/** Simulated network latency for the mock API. */
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Same
// pattern as every other mock service in this codebase.
let terminals: PosTerminal[] = seedTerminals;

export const posTerminalsApi = {
  list: async (): Promise<PosTerminal[]> => {
    await delay(200);
    return terminals;
  },

  get: async (id: string): Promise<PosTerminal | undefined> => {
    await delay(150);
    return terminals.find((t) => t.id === id);
  },

  create: async (input: NewPosTerminalInput): Promise<PosTerminal> => {
    await delay();
    const terminal: PosTerminal = { id: newId("term"), ...input, status: "active" };
    terminals = [terminal, ...terminals];
    return terminal;
  },

  update: async (id: string, input: NewPosTerminalInput): Promise<void> => {
    await delay();
    terminals = terminals.map((t) => (t.id === id ? { ...t, ...input } : t));
  },

  setStatus: async (id: string, status: PosTerminal["status"]): Promise<void> => {
    await delay();
    terminals = terminals.map((t) => (t.id === id ? { ...t, status } : t));
  },
};
