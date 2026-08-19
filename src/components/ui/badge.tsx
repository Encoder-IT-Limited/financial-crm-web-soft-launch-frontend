import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-subtle text-text-3",
        blue: "bg-blue-l text-blue",
        green: "bg-green-l text-green",
        red: "bg-red-l text-red",
        amber: "bg-amber-l text-amber",
        purple: "bg-purple-l text-purple",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
