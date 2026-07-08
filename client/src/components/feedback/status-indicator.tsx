import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HintBox } from "./hint-box";

// 🚀 LOCAL VANILLA CN UTILITY CORES
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 🚦 LOCAL TYPE ISOLATION GATEWAY
export type StatusIndicatorVariant =
  "draft" | "pending" | "posted" | "approved" | "void" | "destructive" | "info";
export type StatusIndicatorSize = "sm" | "md" | "lg";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StatusIndicatorVariant;
  size?: StatusIndicatorSize;
  hasPulse?: boolean;
  label: string;
  hint?: string;
}

const variantStyles: Record<StatusIndicatorVariant, string> = {
  draft:
    "bg-[color-mix(in_oklch_var(--muted)_15%_transparent)] text-muted-foreground border-[color-mix(in_oklch_var(--border)_40%_transparent)]",
  pending:
    "bg-[color-mix(in_oklch_oklch(0.828_0.189_84.429)_12%_transparent)] text-[oklch(0.45_0.15_85)] border-[color-mix(in_oklch_oklch(0.828_0.189_84.429)_35%_transparent)]",
  posted:
    "bg-[color-mix(in_oklch_oklch(0.527_0.154_150.013)_12%_transparent)] text-[oklch(0.42_0.12_150)] border-[color-mix(in_oklch_oklch(0.527_0.154_150.013)_35%_transparent)]",
  approved:
    "bg-[color-mix(in_oklch_oklch(0.527_0.154_150.013)_12%_transparent)] text-[oklch(0.42_0.12_150)] border-[color-mix(in_oklch_oklch(0.527_0.154_150.013)_35%_transparent)]",
  void: "bg-[color-mix(in_oklch_var(--destructive)_12%_transparent)] text-destructive border-[color-mix(in_oklch_var(--destructive)_35%_transparent)]",
  destructive:
    "bg-[color-mix(in_oklch_var(--destructive)_12%_transparent)] text-destructive border-[color-mix(in_oklch_var(--destructive)_35%_transparent)]",
  info: "bg-[color-mix(in_oklch_oklch(0.546_0.245_262.881)_12%_transparent)] text-[oklch(0.45_0.18_265)] border-[color-mix(in_oklch_oklch(0.546_0.245_262.881)_35%_transparent)]",
};

const sizeStyles: Record<
  StatusIndicatorSize,
  { container: string; text: string; dot: string; gap: string }
> = {
  sm: {
    container: "px-2 py-0.5 rounded-full",
    text: "text-xs font-medium leading-none",
    dot: "w-1.5 h-1.5",
    gap: "gap-1.5",
  },
  md: {
    container: "px-2.5 py-1 rounded-full",
    text: "text-sm font-medium leading-none",
    dot: "w-2 h-2",
    gap: "gap-2",
  },
  lg: {
    container: "px-3 py-1.5 rounded-full",
    text: "text-base font-medium leading-none",
    dot: "w-2.5 h-2.5",
    gap: "gap-2.5",
  },
};

const pulseStyles = "animate-pulse duration-1000 ease-in-out";

export function StatusIndicator({
  variant = "draft",
  size = "md",
  hasPulse = false,
  label,
  hint,
  className,
  ...props
}: StatusIndicatorProps) {
  const sizes = sizeStyles[size];
  const variantClass = variantStyles[variant];

  return (
    <>
      {hint && (
        <HintBox content={hint} className="mb-1.5">
          <span aria-hidden="true" style={{ display: "none" }} />
        </HintBox>
      )}
      <div
        className={cn(
          "inline-flex items-center",
          sizes.container,
          sizes.gap,
          variantClass,
          "border",
          "transition-colors duration-200 ease-out",
          className,
        )}
        {...props}
      >
        {hasPulse && (
          <span
            className={cn(
              sizes.dot,
              "rounded-full",
              "bg-current",
              pulseStyles,
              "opacity-70",
            )}
            aria-hidden="true"
          />
        )}
        <span className={cn(sizes.text, "whitespace-nowrap")}>{label}</span>
      </div>
    </>
  );
}

export default StatusIndicator;
