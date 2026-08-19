import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue text-white hover:brightness-110",
        secondary:
          "bg-surface-subtle text-text-2 border border-border hover:border-text-4",
        destructive: "bg-red text-white hover:brightness-110",
        ghost: "bg-transparent text-text-3 hover:bg-surface-subtle",
        icon: "bg-surface-subtle text-slate hover:text-text p-0 justify-center",
      },
      size: {
        default: "px-4 py-2 text-[12.5px]",
        xs: "px-2.5 py-1 text-[11px] rounded-md",
        icon: "size-[30px] rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
