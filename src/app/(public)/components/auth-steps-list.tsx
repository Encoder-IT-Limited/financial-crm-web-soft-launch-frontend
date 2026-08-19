import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthStep = { key: string; label: string; description: string };

type AuthStepsListProps = {
  steps: AuthStep[];
  currentIndex: number;
};

/** Vertical step indicator for the left panel of the signup flow — fits the
 * tall narrow brand column far better than a horizontal stepper would. */
export function AuthStepsList({ steps, currentIndex }: AuthStepsListProps) {
  return (
    <ol className="relative flex flex-col gap-5">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.key} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                  done && "bg-blue text-white",
                  active && "bg-white text-navy",
                  !done && !active && "border border-white/25 text-white/50"
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className={cn("mt-1 h-6 w-px", done ? "bg-blue" : "bg-white/15")} />
              )}
            </div>
            <div className="pt-0.5">
              <div className={cn("text-[13px] font-semibold", active || done ? "text-white" : "text-white/50")}>
                {step.label}
              </div>
              <div className="text-[11.5px] text-white/40">{step.description}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
