import { apiGet, apiSend } from "@/lib/api/envelope";
import type { Plan } from "@/types/plan";
import type { ModuleKey } from "@/lib/permissions";
import type { PlanFormValues } from "../schemas";

function toPlan(row: Plan & { status?: string }): Plan {
  return {
    id: row.id,
    name: row.name,
    priceMonthly: row.priceMonthly,
    priceYearly: row.priceYearly,
    baseSeats: row.baseSeats,
    additionalSeatPrice: row.additionalSeatPrice,
    trialDays: row.trialDays,
    modules: row.modules as ModuleKey[],
    popular: row.popular,
  };
}

export const planApi = {
  list: async (): Promise<Plan[]> => (await apiGet<Plan[]>("/admin/plans")).map(toPlan),

  get: async (id: string): Promise<Plan | undefined> => {
    try {
      return toPlan(await apiGet<Plan>(`/admin/plans/${id}`));
    } catch {
      return undefined;
    }
  },

  create: async (input: PlanFormValues): Promise<Plan> =>
    toPlan(await apiSend<Plan>("post", "/admin/plans", input)),

  update: async (id: string, input: PlanFormValues): Promise<void> => {
    await apiSend("patch", `/admin/plans/${id}`, input);
  },

  delete: async (id: string): Promise<void> => {
    await apiSend("delete", `/admin/plans/${id}`);
  },
};
