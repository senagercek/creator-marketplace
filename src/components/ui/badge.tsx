import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./button";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white",
        secondary: "border-transparent bg-slate-100 text-slate-800",
        outline: "text-slate-800 border-slate-300",
        active: "border-emerald-200 bg-emerald-50 text-emerald-700",
        draft: "border-slate-200 bg-slate-50 text-slate-600",
        paused: "border-amber-200 bg-amber-50 text-amber-700",
        completed: "border-blue-200 bg-blue-50 text-blue-700",
        pending: "border-amber-200 bg-amber-50 text-amber-800",
        approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
        rejected: "border-rose-200 bg-rose-50 text-rose-800",
        paid: "border-indigo-200 bg-indigo-50 text-indigo-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
