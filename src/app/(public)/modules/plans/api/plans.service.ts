import { apiGet } from "@/lib/api/envelope";
import type { Plan } from "@/types/plan";
import type { ModuleKey } from "@/lib/permissions";

export const publicPlansApi = {
  list: async (): Promise<Plan[]> => {
    const rows = await apiGet<Plan[]>("/plans");
    return rows.map((row) => ({
      ...row,
      modules: row.modules as ModuleKey[],
    }));
  },
};
