import React, { forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 🚀 LOCAL VANILLA CN UTILITY CORES
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 🚦 LOCAL TYPE ISOLATION GATEWAY
export interface CardPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  isHoverable?: boolean;
}

export type CardPanelHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export type CardPanelBodyProps = React.HTMLAttributes<HTMLDivElement>;

export type CardPanelFooterProps = React.HTMLAttributes<HTMLDivElement>;

// 🎨 BASE CONTAINER STYLES - Premium Surface v2.8 Glassmorphism
const containerBaseStyles =
  "bg-card/90 backdrop-blur-[var(--backdrop-blur)] border border-[color-mix(in_oklch,var(--color-border)_40%,transparent)] rounded-[var(--radius-surface,12px)] transition-all duration-200 ease-out";

const hoverableStyles = "hover:scale-[1.01] hover:shadow-lg";

const headerBaseStyles =
  "flex items-center justify-between px-6 py-4 border-b border-[color-mix(in_oklch,var(--color-border)_40%,transparent)]";

const bodyBaseStyles = "px-6 py-4";

const footerBaseStyles =
  "flex items-center justify-end gap-3 px-6 py-4 border-t border-[color-mix(in_oklch,var(--color-border)_40%,transparent)]";

// 🏗️ CARD PANEL ROOT - Parent Shell
export const CardPanelRoot = forwardRef<HTMLDivElement, CardPanelProps>(
  ({ isHoverable = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          containerBaseStyles,
          isHoverable && hoverableStyles,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardPanelRoot.displayName = "CardPanelRoot";

// 📋 CARD PANEL HEADER - Top Row Header Grid Slot
export const CardPanelHeader = forwardRef<HTMLDivElement, CardPanelHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(headerBaseStyles, className)} {...props}>
        {children}
      </div>
    );
  },
);

CardPanelHeader.displayName = "CardPanelHeader";

// 📦 CARD PANEL BODY - Core Data Payload Content Zone
export const CardPanelBody = forwardRef<HTMLDivElement, CardPanelBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(bodyBaseStyles, className)} {...props}>
        {children}
      </div>
    );
  },
);

CardPanelBody.displayName = "CardPanelBody";

// 🔧 CARD PANEL FOOTER - Bottom Slot Toolbar Context Actions
export const CardPanelFooter = forwardRef<HTMLDivElement, CardPanelFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(footerBaseStyles, className)} {...props}>
        {children}
      </div>
    );
  },
);

CardPanelFooter.displayName = "CardPanelFooter";

// 🎯 COMPOUND COMPONENT EXPORT - Main Entry Point
export const CardPanel = Object.assign(CardPanelRoot, {
  Header: CardPanelHeader,
  Body: CardPanelBody,
  Footer: CardPanelFooter,
});

export default CardPanel;
