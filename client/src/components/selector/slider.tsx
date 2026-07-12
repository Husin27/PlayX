"use client";

import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useId,
} from "react";
import { cn } from "@/lib/utils";
import { HintBox } from "../feedback/hint-box";
import type { PopupMenuConfig } from "../feedback/popup-menu";

// ðŸš¦ LOCAL TYPE ISOLATION GATEWAY
export interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "onChange"
  | "value"
  | "defaultValue"
  | "type"
  | "aria-describedby"
  | "aria-invalid"
  | "aria-disabled"
  | "aria-valuemin"
  | "aria-valuemax"
  | "aria-valuenow"
  | "aria-valuetext"
  | "aria-orientation"
> {
  label?: string;
  error?: string;
  hint?: string;
  popupMenu?: PopupMenuConfig;
  min?: number;
  max?: number;
  step?: number;
  value?: number | string;
  defaultValue?: number | string;
  stepsArray?: string[];
  onChange?: (value: number | string) => void;
  showValue?: boolean;
  orientation?: "horizontal" | "vertical";
  readOnly?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      error,
      hint,
      popupMenu,
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      stepsArray,
      onChange,
      className,
      disabled,
      showValue = true,
      orientation = "horizontal",
      id: providedId,
      required,
      name,
      readOnly = false,
    },
    ref,
  ) => {
    const {
      onKeyDown: onKeyDownProp,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      ...restProps
    } = {
      label,
      error,
      hint,
      popupMenu,
      min,
      max,
      step,
      value,
      defaultValue,
      stepsArray,
      onChange,
      className,
      disabled,
      showValue,
      orientation,
      id: providedId,
      required,
      name,
      readOnly,
      onKeyDown: undefined,
      onFocus: undefined,
      onBlur: undefined,
    };

    const sliderRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startValueRef = useRef(0);

    const isEnumMode = stepsArray && stepsArray.length > 0;
    const enumMin = 0;
    const enumMax = isEnumMode ? stepsArray.length - 1 : max;
    const enumStep = isEnumMode ? 1 : step;
    const effectiveMin = isEnumMode ? enumMin : min;
    const effectiveMax = isEnumMode ? enumMax : max;
    const effectiveStep = isEnumMode ? enumStep : step;

    const [internalValue, setInternalValue] = useState<number>(() => {
      if (value !== undefined) {
        if (isEnumMode && typeof value === "string") {
          return stepsArray!.indexOf(value);
        }
        return typeof value === "number"
          ? value
          : parseFloat(value as string) || effectiveMin;
      }
      if (defaultValue !== undefined) {
        if (isEnumMode && typeof defaultValue === "string") {
          return stepsArray!.indexOf(defaultValue);
        }
        return typeof defaultValue === "number"
          ? defaultValue
          : parseFloat(defaultValue as string) || effectiveMin;
      }
      return effectiveMin;
    });

    const generatedId = useId();
    const id = providedId ?? generatedId;
    const errorId = `${id}-error`;

    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);

    const isActuallyDisabled = disabled ?? false;
    const isReadOnly = readOnly;
    const isActuallyDisabledOrReadOnly = isActuallyDisabled || isReadOnly;
    const clampedValue = useMemo(() => {
      let val = internalValue;
      if (val < effectiveMin) val = effectiveMin;
      if (val > effectiveMax) val = effectiveMax;
      const stepped =
        Math.round((val - effectiveMin) / effectiveStep) * effectiveStep +
        effectiveMin;
      return Math.min(Math.max(stepped, effectiveMin), effectiveMax);
    }, [internalValue, effectiveMin, effectiveMax, effectiveStep]);

    const percentage = useMemo(() => {
      if (effectiveMax === effectiveMin) return 0;
      return (
        ((clampedValue - effectiveMin) / (effectiveMax - effectiveMin)) * 100
      );
    }, [clampedValue, effectiveMin, effectiveMax]);

    const displayValue = useMemo(() => {
      if (isEnumMode) {
        return stepsArray[clampedValue] ?? "";
      }
      return clampedValue;
    }, [isEnumMode, stepsArray, clampedValue]);

    const hasError = !!error;

    useEffect(() => {
      if (value !== undefined) {
        if (isEnumMode && typeof value === "string") {
          const idx = stepsArray!.indexOf(value);
          if (idx !== -1) setInternalValue(idx);
        } else {
          const numVal =
            typeof value === "number" ? value : parseFloat(value as string);
          if (!isNaN(numVal)) setInternalValue(numVal);
        }
      }
    }, [value, isEnumMode, stepsArray]);

    const notifyChange = useCallback(
      (newValue: number) => {
        const finalValue = isEnumMode ? stepsArray[newValue] : newValue;
        onChange?.(finalValue);
      },
      [isEnumMode, stepsArray, onChange],
    );

    const updateValueFromPosition = useCallback(
      (clientX: number, clientY: number) => {
        if (!trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        let newPercentage: number;

        if (orientation === "horizontal") {
          newPercentage = ((clientX - rect.left) / rect.width) * 100;
        } else {
          newPercentage = ((rect.bottom - clientY) / rect.height) * 100;
        }

        newPercentage = Math.max(0, Math.min(100, newPercentage));
        const newValue =
          effectiveMin + (newPercentage / 100) * (effectiveMax - effectiveMin);
        const steppedValue =
          Math.round((newValue - effectiveMin) / effectiveStep) *
            effectiveStep +
          effectiveMin;
        const clamped = Math.min(
          Math.max(steppedValue, effectiveMin),
          effectiveMax,
        );

        setInternalValue(clamped);
        notifyChange(clamped);
      },
      [effectiveMin, effectiveMax, effectiveStep, orientation, notifyChange],
    );

    const handleMouseDown = useCallback(
      (
        e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
      ) => {
        if (isActuallyDisabledOrReadOnly) return;

        isDraggingRef.current = true;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        startXRef.current = clientX;
        startValueRef.current = clampedValue;

        e.preventDefault();
        updateValueFromPosition(clientX, clientY);
      },
      [isActuallyDisabledOrReadOnly, clampedValue, updateValueFromPosition],
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current || isActuallyDisabledOrReadOnly) return;

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        updateValueFromPosition(clientX, clientY);
      },
      [isActuallyDisabledOrReadOnly, updateValueFromPosition],
    );

    const handleMouseUp = useCallback(() => {
      isDraggingRef.current = false;
    }, []);

    useEffect(() => {
      if (isDraggingRef.current) {
        document.addEventListener(
          "mousemove",
          handleMouseMove as EventListener,
        );
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener(
          "touchmove",
          handleMouseMove as EventListener as EventListener,
          { passive: false },
        );
        document.addEventListener("touchend", handleMouseUp);
      }

      return () => {
        document.removeEventListener(
          "mousemove",
          handleMouseMove as EventListener,
        );
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener(
          "touchmove",
          handleMouseMove as EventListener as EventListener,
        );
        document.removeEventListener("touchend", handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    const handleTrackClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isActuallyDisabledOrReadOnly) return;
        if (e.currentTarget === e.target) {
          updateValueFromPosition(e.clientX, e.clientY);
        }
      },
      [isActuallyDisabledOrReadOnly, updateValueFromPosition],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isActuallyDisabledOrReadOnly) {
          onKeyDownProp?.(e);
          return;
        }

        let newValue = clampedValue;
        let shouldUpdate = false;

        switch (e.key) {
          case "ArrowRight":
          case "ArrowUp":
            e.preventDefault();
            newValue = Math.min(clampedValue + effectiveStep, effectiveMax);
            shouldUpdate = true;
            break;
          case "ArrowLeft":
          case "ArrowDown":
            e.preventDefault();
            newValue = Math.max(clampedValue - effectiveStep, effectiveMin);
            shouldUpdate = true;
            break;
          case "Home":
            e.preventDefault();
            newValue = effectiveMin;
            shouldUpdate = true;
            break;
          case "End":
            e.preventDefault();
            newValue = effectiveMax;
            shouldUpdate = true;
            break;
          case "PageUp":
            e.preventDefault();
            newValue = Math.min(
              clampedValue + effectiveStep * 10,
              effectiveMax,
            );
            shouldUpdate = true;
            break;
          case "PageDown":
            e.preventDefault();
            newValue = Math.max(
              clampedValue - effectiveStep * 10,
              effectiveMin,
            );
            shouldUpdate = true;
            break;
        }

        if (shouldUpdate) {
          setInternalValue(newValue);
          notifyChange(newValue);
        }

        onKeyDownProp?.(e);
      },
      [
        isActuallyDisabledOrReadOnly,
        clampedValue,
        effectiveMin,
        effectiveMax,
        effectiveStep,
        notifyChange,
        onKeyDownProp,
      ],
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        setFocused(true);
        onFocusProp?.(e);
      },
      [onFocusProp],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        setFocused(false);
        onBlurProp?.(e);
      },
      [onBlurProp],
    );

    const combinedRef = useCallback(
      (el: HTMLInputElement | null) => {
        if (ref) {
          if (typeof ref === "function") {
            ref(el);
          } else {
            ref.current = el;
          }
        }
      },
      [ref],
    );

    const trackClasses = cn(
      "relative",
      "w-full h-2",
      "rounded-full bg-border",
      "transition-colors duration-200 ease-out",
      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
      "peer-aria-invalid:border-destructive peer-aria-invalid:ring-3 peer-aria-invalid:ring-destructive/20",
      hasError && "border-destructive peer-focus-visible:ring-destructive",
      orientation === "vertical" && "w-2 h-full",
      className,
    );

    const progressClasses = cn(
      "absolute",
      "rounded-full",
      "bg-brand-primary",
      "transition-all duration-150 ease-out",
      orientation === "horizontal"
        ? "h-full left-0 top-0"
        : "w-full bottom-0 left-0",
    );

    const thumbClasses = cn(
      "absolute",
      "w-5 h-5",
      "rounded-full bg-white",
      "shadow-lg shadow-black/15",
      "border-2 border-brand-primary",
      "transition-all duration-150 ease-out",
      "active:scale-110",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "hover:scale-110 hover:shadow-xl",
      "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
      "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
      orientation === "horizontal"
        ? "top-1/2 -translate-y-1/2 -translate-x-1/2"
        : "left-1/2 -translate-x-1/2 -translate-y-1/2",
      focused &&
        "ring-2 ring-brand-primary ring-offset-2 ring-offset-background",
      hovered && "scale-110 shadow-xl",
    );

    const labelClasses = cn(
      "block text-sm font-medium leading-none",
      "transition-colors duration-200 ease-out",
      "text-text-main",
      hasError && "text-destructive/90",
      isActuallyDisabled && "opacity-50",
      "mb-2",
    );

    const valueDisplayClasses = cn(
      "absolute",
      "text-xs font-medium",
      "text-text-main",
      "transition-all duration-150 ease-out",
      "pointer-events-none",
      "white-space-nowrap",
      orientation === "horizontal"
        ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
        : "right-full top-1/2 -translate-y-1/2 mr-2",
      isEnumMode && "min-w-[60px] text-center",
    );

    const containerClasses = cn(
      "inline-flex flex-col gap-2",
      orientation === "vertical" && "items-center",
      isActuallyDisabledOrReadOnly && "opacity-50 pointer-events-none",
    );

    const errorClasses = cn(
      "text-sm",
      "text-destructive/90",
      "transition-colors duration-200 ease-out",
      "mt-1",
    );

    return (
      <div
        className={containerClasses}
        role="group"
        aria-invalid={hasError}
        aria-disabled={isActuallyDisabled}
        onContextMenu={(e) => popupMenu?.trigger(e)}
      >
        {hint && (
          <HintBox content={hint} className="mb-1.5">
            <span className="text-sm text-text-muted" />
          </HintBox>
        )}
        {label && (
          <label htmlFor={id} className={labelClasses}>
            {label}
          </label>
        )}

        <div
          ref={sliderRef}
          className={cn(
            "relative",
            orientation === "horizontal" ? "w-full" : "h-64",
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={
            handleMouseDown as React.TouchEventHandler<HTMLDivElement>
          }
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          tabIndex={isActuallyDisabledOrReadOnly ? -1 : 0}
          role="slider"
          id={id}
          aria-label={label}
          aria-valuemin={effectiveMin}
          aria-valuemax={effectiveMax}
          aria-valuenow={clampedValue}
          aria-valuetext={String(displayValue)}
          aria-orientation={orientation}
          aria-disabled={isActuallyDisabledOrReadOnly}
          aria-invalid={hasError ? "true" : "false"}
          aria-required={required}
          aria-describedby={hasError ? errorId : undefined}
        >
          <div
            ref={trackRef}
            className={trackClasses}
            onClick={handleTrackClick}
            role="presentation"
            aria-hidden="true"
          >
            <div
              className={progressClasses}
              style={
                orientation === "horizontal"
                  ? { width: `${percentage}%` }
                  : { height: `${percentage}%` }
              }
              role="presentation"
              aria-hidden="true"
            />
            <div
              ref={thumbRef}
              className={thumbClasses}
              style={
                orientation === "horizontal"
                  ? { left: `${percentage}%` }
                  : { bottom: `${percentage}%` }
              }
              role="presentation"
              aria-hidden="true"
            />
          </div>

          {showValue && (
            <div
              className={valueDisplayClasses}
              style={
                orientation === "horizontal"
                  ? { left: `${percentage}%` }
                  : { bottom: `${percentage}%` }
              }
              aria-hidden="true"
            >
              {displayValue}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className={errorClasses}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        <input
          ref={combinedRef}
          type="hidden"
          value={isEnumMode ? displayValue : clampedValue}
          disabled={isActuallyDisabled}
          required={required}
          name={name}
        />
      </div>
    );
  },
);

Slider.displayName = "Slider";
