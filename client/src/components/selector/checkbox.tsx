"use client";

import React, {
  useEffect,
  useRef,
  createContext,
  useContext,
  forwardRef,
  useMemo,
  useId,
  useState,
} from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HintBox } from "../feedback/hint-box";
import type { PopupMenuConfig } from "../feedback/popup-menu";

// ðŸš¦ LOCAL TYPE ISOLATION GATEWAY
export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "onChange"
  | "value"
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
  isIndeterminate?: boolean;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  readOnly?: boolean;
  onChange?: (checked: boolean | "indeterminate", value?: string) => void;
}

export interface CheckboxGroupProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxChoice?: number;
  disabled?: boolean;
  error?: string;
  hint?: string;
  popupMenu?: PopupMenuConfig;
  children: React.ReactNode;
  className?: string;
}

interface CheckboxGroupContextValue {
  value: string[];
  onChange: (value: string[]) => void;
  maxChoice?: number;
  disabled?: boolean;
  error?: string;
  errorId: string;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null,
);

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      hint,
      popupMenu,
      isIndeterminate = false,
      value,
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
    const groupContext = useContext(CheckboxGroupContext);
    const isInGroup = !!groupContext;
    const isGroupDisabled = groupContext?.disabled ?? false;
    const isGroupError = groupContext?.error;
    const groupValue = groupContext?.value ?? [];
    const groupMaxChoice = groupContext?.maxChoice;
    const groupOnChange = groupContext?.onChange;

    const isActuallyDisabled = disabled || isGroupDisabled;
    const isReadOnly = readOnly || (isInGroup && groupContext?.disabled);
    const isControlled = checked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = useState(
      defaultChecked ?? false,
    );
    const isChecked = isInGroup
      ? groupValue.includes(value ?? "")
      : isControlled
        ? checked
        : uncontrolledChecked;
    const hasError = error || isGroupError;
    const isAtMaxChoice =
      groupMaxChoice !== undefined &&
      groupValue.length >= groupMaxChoice &&
      !isChecked;

    // hint and popupMenu are handled by CheckboxGroup
    void hint;
    void popupMenu;

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = isIndeterminate;
      }
    }, [isIndeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isActuallyDisabled || isReadOnly || isAtMaxChoice) return;

      const newChecked = e.target.checked;
      const newValue = value ?? "";

      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }

      if (isInGroup && groupOnChange) {
        const newGroupValue = newChecked
          ? [...groupValue, newValue]
          : groupValue.filter((v) => v !== newValue);
        groupOnChange(newGroupValue);
      }

      onChange?.(newChecked ? true : false, newValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === " " && (isActuallyDisabled || isReadOnly)) {
        e.preventDefault();
        return;
      }
      onKeyDown?.(e);
    };

    const checkboxClasses = cn(
      "relative inline-flex items-center justify-center",
      "w-5 h-5 shrink-0",
      "rounded-md border-2",
      "border-border bg-background",
      "transition-all duration-200 ease-out",
      "active:scale-95",
      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
      "peer-aria-invalid:border-destructive peer-aria-invalid:ring-3 peer-aria-invalid:ring-destructive/20",
      isChecked && !isIndeterminate
        ? "bg-brand-primary border-brand-primary text-white shadow-sm hover:shadow-md"
        : isIndeterminate
          ? "bg-brand-primary border-brand-primary text-white shadow-sm hover:shadow-md"
          : "hover:border-brand-primary/50 hover:bg-brand-primary/5",
      isAtMaxChoice && "opacity-50 cursor-not-allowed",
      isReadOnly && "opacity-75 cursor-default",
      hasError && "border-destructive peer-focus-visible:ring-destructive",
      className,
    );

    const iconClasses = cn(
      "transition-all duration-200 ease-out",
      isChecked && !isIndeterminate
        ? "scale-100 opacity-100"
        : "scale-0 opacity-0",
      isIndeterminate ? "scale-100 opacity-100" : "scale-0 opacity-0",
    );

    const indeterminateIconClasses = cn(
      "transition-all duration-200 ease-out",
      isIndeterminate ? "scale-100 opacity-100" : "scale-0 opacity-0",
    );

    const groupErrorId = isInGroup ? groupContext?.errorId : undefined;

    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          isActuallyDisabled &&
            "opacity-50 pointer-events-none cursor-not-allowed",
          isReadOnly && !isActuallyDisabled && "cursor-default",
        )}
        htmlFor={id}
      >
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
          checked={isChecked}
          disabled={isActuallyDisabled || isAtMaxChoice}
          readOnly={isReadOnly}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-checked={isIndeterminate ? "mixed" : isChecked}
          aria-invalid={hasError ? "true" : "false"}
          aria-disabled={isActuallyDisabled}
          aria-readonly={isReadOnly}
          aria-required={required}
          aria-describedby={
            hasError ? (isInGroup ? groupErrorId : errorId) : undefined
          }
          className="sr-only peer"
        />
        <div className={checkboxClasses} aria-hidden="true">
          {isIndeterminate ? (
            <Minus
              className={cn("w-3 h-3", indeterminateIconClasses)}
              aria-hidden="true"
            />
          ) : (
            <Check
              className={cn("w-3.5 h-3.5", iconClasses)}
              aria-hidden="true"
            />
          )}
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
    );
  },
);
Checkbox.displayName = "Checkbox";

export const CheckboxGroup = ({
  value,
  onChange,
  maxChoice,
  disabled,
  error,
  hint,
  popupMenu,
  children,
  className,
}: CheckboxGroupProps) => {
  const errorId = useId();

  const contextValue = useMemo(
    () => ({
      value,
      onChange,
      maxChoice,
      disabled,
      error,
      errorId,
    }),
    [value, onChange, maxChoice, disabled, error, errorId],
  );

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      <div
        className={cn("inline-flex flex-col gap-2", className)}
        role="group"
        aria-invalid={!!error}
        aria-disabled={disabled}
        onContextMenu={(e) => popupMenu?.trigger(e)}
      >
        {hint && (
          <HintBox content={hint} className="mb-1.5">
            <span className="text-sm text-text-muted" />
          </HintBox>
        )}
        {children}
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
    </CheckboxGroupContext.Provider>
  );
};
CheckboxGroup.displayName = "CheckboxGroup";
