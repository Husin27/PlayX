import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

// 🚦 LOCAL TYPE ISOLATION GATEWAY
export interface CardPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  isHoverable?: boolean;
}

export type CardPanelHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export type CardPanelBodyProps = React.HTMLAttributes<HTMLDivElement>;

export type CardPanelFooterProps = React.HTMLAttributes<HTMLDivElement>;

// 🎨 BASE CONTAINER STYLES - Premium Surface v2.8 Glassmorphism
const containerBaseStyles =
  "bg-card/90 backdrop-blur-[var(--backdrop-blur)] border border-[color-mix(in_oklch,var(--color-border)_40%,transparent)] rounded-[var(--radius-surface,12px)] transition-all duration-300 ease-out will-change-[box-shadow,border-color]";

const hoverableStyles =
  "hover:shadow-xl hover:border-[color-mix(in_oklch,var(--color-brand-primary)_40%,transparent)]";

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
