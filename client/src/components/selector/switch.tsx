"use client";

import React, { forwardRef, useRef, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { HintBox } from "../feedback/hint-box";
import type { PopupMenuConfig } from "../feedback/popup-menu";

// ðŸš¦ LOCAL TYPE ISOLATION GATEWAY
export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "onChange"
  | "type"
  | "aria-describedby"
  | "aria-invalid"
  | "aria-disabled"
  | "aria-checked"
  | "aria-required"
> {
  label?: string;
  error?: string;
  hint?: string;
  popupMenu?: PopupMenuConfig;
  checked?: boolean;
  defaultChecked?: boolean;
  readOnly?: boolean;
  onChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      error,
      hint,
      popupMenu,
      checked,
      defaultChecked,
      readOnly = false,
      onChange,
      className,
      disabled,
      id: providedId,
      onFocus,
      onBlur,
      onKeyDown,
      required,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const errorId = `${id}-error`;
    const isControlled = checked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = useState(
      defaultChecked ?? false,
    );
    const isChecked = isControlled ? checked : uncontrolledChecked;
    const hasError = !!error;
    const isActuallyDisabled = disabled ?? false;
    const isReadOnly = readOnly;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isActuallyDisabled || isReadOnly) return;
      const newChecked = e.target.checked;
      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }
      onChange?.(newChecked);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!isActuallyDisabled && !isReadOnly) {
          const newChecked = !isChecked;
          if (!isControlled) {
            setUncontrolledChecked(newChecked);
          }
          onChange?.(newChecked);
        }
      }
      onKeyDown?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
    };

    const switchTrackClasses = cn(
      "relative inline-flex items-center",
      "w-11 h-6 shrink-0",
      "rounded-full border-2",
      "border-border bg-background",
      "transition-all duration-200 ease-out",
      "active:scale-95 duration-150 transition-all",
      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
      "peer-aria-invalid:border-destructive peer-aria-invalid:ring-3 peer-aria-invalid:ring-destructive/20",
      isChecked
        ? "bg-brand-primary border-brand-primary shadow-sm hover:shadow-md"
        : "hover:border-brand-primary/50 hover:bg-brand-primary/5",
      hasError && "border-destructive peer-focus-visible:ring-destructive",
      isReadOnly && !isActuallyDisabled && "opacity-75 cursor-default",
      className,
    );

    const thumbClasses = cn(
      "relative inline-block",
      "w-5 h-5 shrink-0",
      "rounded-full bg-white",
      "shadow-md shadow-black/10",
      "transition-transform duration-200 ease-spring",
      "active:scale-95",
      isChecked ? "translate-x-full" : "translate-x-0",
      hasError && "shadow-destructive/20",
      isReadOnly && !isActuallyDisabled && "opacity-75",
    );

    const labelClasses = cn(
      "inline-flex items-center gap-2 cursor-pointer select-none",
      "transition-colors duration-200 ease-out",
      "text-text-main",
      hasError && "text-destructive/90",
      isActuallyDisabled && "opacity-50 pointer-events-none cursor-not-allowed",
      isReadOnly && !isActuallyDisabled && "cursor-default opacity-75",
    );

    return (
      <div className="w-full" onContextMenu={(e) => popupMenu?.trigger(e)}>
        {hint && (
          <HintBox content={hint} className="mb-1.5">
            <span className="text-sm text-text-muted" />
          </HintBox>
        )}
        <label className={labelClasses} htmlFor={id}>
          <input
            ref={(el) => {
              inputRef.current = el;
              if (ref) {
                if (typeof ref === "function") {
                  ref(el);
                } else {
                  ref.current = el;
                }
              }
            }}
            {...props}
            id={id}
            type="checkbox"
            role="switch"
            checked={isChecked}
            disabled={isActuallyDisabled}
            readOnly={isReadOnly}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-checked={isChecked}
            aria-invalid={hasError ? "true" : "false"}
            aria-disabled={isActuallyDisabled}
            aria-readonly={isReadOnly}
            aria-required={required}
            aria-describedby={hasError ? errorId : undefined}
            className="sr-only peer"
          />
          <div className={switchTrackClasses} aria-hidden="true">
            <span className={thumbClasses} aria-hidden="true" />
          </div>
          {label && (
            <span
              className={cn(
                "text-sm font-medium leading-none",
                "transition-colors duration-200 ease-out",
                "text-text-main",
                hasError && "text-destructive/90",
                isActuallyDisabled && "opacity-50",
                isReadOnly && !isActuallyDisabled && "opacity-75",
              )}
            >
              {label}
            </span>
          )}
        </label>
        {error && (
          <p
            id={errorId}
            className={cn(
              "text-sm",
              "text-destructive/90",
              "transition-colors duration-200 ease-out",
              "mt-1",
            )}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
Switch.displayName = "Switch";
