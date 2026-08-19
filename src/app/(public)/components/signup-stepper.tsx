import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignupStep = { key: string; label: string };

type SignupStepperProps = {
  steps: SignupStep[];
  currentIndex: number;
  className?: string;
};

/** Step indicator for the /signup wizard (Plan → Company → Owner → Done). */
export function SignupStepper({ steps, currentIndex, className }: SignupStepperProps) {
  return (
    <ol className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  done && "bg-blue text-white",
                  active && "border-2 border-blue text-blue",
                  !done && !active && "border border-border text-text-4"
                )}
              >
                {done ? <Check className="size-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[12px] font-medium sm:inline",
                  (done || active) ? "text-text" : "text-text-4"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("h-px flex-1", done ? "bg-blue" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
