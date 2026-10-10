import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[12.5px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent-soft text-accent-ink",
        secondary: "border-transparent bg-surface-2 text-ink-2",
        destructive: "border-transparent bg-neg-soft text-neg",
        outline: "border-line text-ink-2",
        success: "border-transparent bg-pos-soft text-pos",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
