import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

// 🚦 LOCAL TYPE ISOLATION GATEWAY
export type BadgeVariant = "brand" | "success" | "warning" | "danger" | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  brand: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  danger: "bg-red-500/10 text-red-500 border-red-500/20",
  muted: "bg-muted/50 text-muted-foreground border-transparent",
};

const baseStyles =
  "inline-flex items-center w-max text-xs font-medium tabular-nums rounded-full px-2.5 py-0.5 border transition-colors duration-200 ease-out";

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "muted", className, children, ...props }, ref) => {
    const variantClass = variantStyles[variant];

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantClass, className)}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
