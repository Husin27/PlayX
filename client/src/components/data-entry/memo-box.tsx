import React, {
  forwardRef,
  useEffect,
  useRef,
  useCallback,
  useState,
  useId,
} from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { HintBox } from "../feedback/hint-box";
import type { PopupMenuConfig } from "../feedback/popup-menu";
import { Button } from "../general/button";

export interface MemoBoxActionConfig {
  icon: LucideIcon;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  tooltipText?: string;
}

export interface MemoBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  popupMenu?: PopupMenuConfig;
  actionIcons?: MemoBoxActionConfig[];
}

export const MemoBox = forwardRef<HTMLTextAreaElement, MemoBoxProps>(
  (
    {
      label,
      error,
      hint,
      popupMenu,
      actionIcons = [],
      className,
      disabled,
      readOnly,
      required,
      placeholder,
      rows = 4,
      onFocus,
      onBlur,
      onChange: consumerOnChange,
      ...props
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasError = Boolean(error);
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const textareaId = props.id ?? generatedId;
    const errorId = hasError ? `${textareaId}-error` : undefined;

    const handleRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;
        if (ref) {
          if (typeof ref === "function") {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      },
      [ref],
    );

    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const newHeight = textarea.scrollHeight;
        textarea.style.height = `${newHeight}px`;
      }
    }, []);

    useEffect(() => {
      adjustHeight();
    }, [adjustHeight]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight();
        consumerOnChange?.(e);
      },
      [adjustHeight, consumerOnChange],
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    const limitedActionIcons = actionIcons.slice(0, 4);

    return (
      <div
        className={cn("w-full", className)}
        onContextMenu={(e) => popupMenu?.trigger(e)}
      >
        {hint && (
          <HintBox content={hint} className="mb-1.5">
            <span className="text-sm text-text-muted" />
          </HintBox>
        )}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              "block text-sm font-medium text-text-main mb-1.5",
              disabled && "opacity-50",
            )}
          >
            {label}
            {required && (
              <span className="text-destructive ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={handleRef}
            {...props}
            id={textareaId}
            className={cn(
              "w-full bg-card/90 backdrop-blur-[var(--backdrop-blur)]",
              "border-[color-mix(in_oklch,var(--color-border)_60%,transparent)]",
              "rounded-surface",
              "text-text-main placeholder:text-muted-foreground/60",
              "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
              "transition-all duration-200 ease-out",
              "resize-none",
              "px-4 py-3",
              "min-h-[100px]",
              hasError && "border-destructive/50",
              disabled && "bg-muted/50",
              readOnly && "bg-muted/30 border-muted-foreground/20",
              !readOnly &&
                !hasError &&
                isFocused &&
                "ring-2 ring-amber-500/20 border-amber-500",
              hasError && isFocused && "ring-destructive/50 border-destructive",
            )}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            placeholder={placeholder}
            rows={rows}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={hasError}
            aria-describedby={errorId}
          />
          {limitedActionIcons.length > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              {limitedActionIcons.map((action, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="active:scale-95 transition-all duration-100"
                  aria-label={action.tooltipText}
                  disabled={disabled}
                  onClick={action.onClick}
                >
                  <action.icon className="w-4 h-4" aria-hidden="true" />
                </Button>
              ))}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className={cn(
              "mt-1.5 text-sm",
              "text-destructive/90",
              "font-medium",
            )}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

MemoBox.displayName = "MemoBox";
