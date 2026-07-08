import React, { forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HintBox } from "../feedback/hint-box";

// 🚀 LOCAL VANILLA CN UTILITY CORES
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 🚦 LOCAL TYPE ISOLATION GATEWAY
export type ProgressVariant = "brand" | "success" | "warning" | "danger";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  hint?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      variant = "brand",
      showLabel = false,
      className,
      hint,
      ...props
    },
    ref,
  ) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    const variantStyles = {
      brand: "bg-brand-primary",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      danger: "bg-red-500",
    } as const satisfies Record<ProgressVariant, string>;

    const containerStyles = {
      brand: "bg-brand-primary/10",
      success: "bg-emerald-500/10",
      warning: "bg-amber-500/10",
      danger: "bg-red-500/10",
    } as const satisfies Record<ProgressVariant, string>;

    const labelStyles = {
      brand: "text-brand-primary",
      success: "text-emerald-600 dark:text-emerald-400",
      warning: "text-amber-600 dark:text-amber-400",
      danger: "text-red-600 dark:text-red-400",
    } as const satisfies Record<ProgressVariant, string>;

    return (
      <>
        {hint && (
          <HintBox content={hint} className="mb-1.5">
            <span aria-hidden="true" style={{ display: "none" }} />
          </HintBox>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            "relative w-full h-2 rounded-full overflow-hidden",
            containerStyles[variant],
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantStyles[variant],
            )}
            style={{ width: `${clampedValue}%` }}
            aria-hidden="true"
          />
          {showLabel && (
            <span
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 pr-1.5 text-xs font-medium tabular-nums",
                labelStyles[variant],
              )}
              aria-hidden="true"
            >
              {clampedValue}%
            </span>
          )}
        </div>
      </>
    );
  },
);
Progress.displayName = "Progress";
