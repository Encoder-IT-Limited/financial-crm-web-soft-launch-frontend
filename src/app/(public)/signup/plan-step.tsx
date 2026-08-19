"use client";

import { PlanSelectCard } from "./plan-select-card";
import { PLANS } from "../components/plans-data";
import type { Plan } from "@/types/plan";

type PlanStepProps = {
  selectedId?: string;
  onSelect: (plan: Plan) => void;
};

export function PlanStep({ selectedId, onSelect }: PlanStepProps) {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-text">Choose your plan</h1>
      <p className="mt-1.5 text-[13px] text-text-3">You can change plans anytime.</p>

      <div className="mt-7 flex flex-col gap-3">
        {PLANS.map((p) => (
          <PlanSelectCard key={p.id} plan={p} selected={selectedId === p.id} onSelect={() => onSelect(p)} />
        ))}
      </div>
    </>
  );
}
