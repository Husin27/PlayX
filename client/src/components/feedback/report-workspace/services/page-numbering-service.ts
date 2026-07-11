/**
 * Page Numbering Service - Creates and manages page number overlays.
 * Idempotent: applying twice never duplicates overlays; removing clears completely.
 */

import type { DOMEngine } from "../engines/dom-engine";

export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface PageNumberingConfig {
  /** Format string with {page} and {total} placeholders */
  format?: string;
  /** Position of the page number on each page */
  position?: PageNumberPosition;
  /** CSS class for the page number element */
  className?: string;
  /** Whether page numbering is enabled */
  enabled?: boolean;
}

const DEFAULT_CONFIG: Required<PageNumberingConfig> = {
  format: "Page {page}",
  position: "bottom-right",
  className: "page-number-overlay",
  enabled: false,
};

const POSITION_STYLES: Record<PageNumberPosition, React.CSSProperties> = {
  "top-left": { top: "8px", left: "12px" },
  "top-center": { top: "8px", left: "50%", transform: "translateX(-50%)" },
  "top-right": { top: "8px", right: "12px" },
  "bottom-left": { bottom: "8px", left: "12px" },
  "bottom-center": {
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
  },
  "bottom-right": { bottom: "8px", right: "12px" },
};

export class PageNumberingService {
  private container: HTMLElement | null = null;
  private domEngine: DOMEngine | null = null;
  private config: Required<PageNumberingConfig> = DEFAULT_CONFIG;
  private initialized = false;
  private overlays: Set<HTMLElement> = new Set();

  /**
   * Initialize the service with container and DOM engine.
   * Must be called before any other methods.
   */
  public initialize(container: HTMLElement, domEngine: DOMEngine): void {
    this.container = container;
    this.domEngine = domEngine;
    this.initialized = true;
  }

  /**
   * Update the page numbering configuration.
   * If numbering is already applied, it will be reapplied with new config.
   */
  public setConfig(config: PageNumberingConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (this.initialized && this.config.enabled) {
      this.applyNumbering();
    } else if (this.initialized && !this.config.enabled) {
      this.removeNumbering();
    }
  }

  /**
   * Get current configuration.
   */
  public getConfig(): Readonly<Required<PageNumberingConfig>> {
    return { ...this.config };
  }

  /**
   * Apply page numbering to all pages.
   * Idempotent: calling multiple times will not duplicate overlays.
   */
  public applyNumbering(): void {
    if (
      !this.initialized ||
      !this.container ||
      !this.domEngine ||
      !this.config.enabled
    ) {
      return;
    }

    // First remove any existing numbering to ensure idempotency
    this.removeNumbering();

    const pages = this.domEngine.getPages();
    const totalPages = pages.length > 0 ? pages.length : 1;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNumber = i + 1;

      const overlay = this.createOverlay(pageNumber, totalPages);
      this.positionOverlay(overlay);
      page.appendChild(overlay);
      this.overlays.add(overlay);
    }
  }

  /**
   * Remove all page numbering overlays.
   * Idempotent: calling multiple times is safe.
   */
  public removeNumbering(): void {
    for (const overlay of this.overlays) {
      overlay.remove();
    }
    this.overlays.clear();
  }

  /**
   * Update page numbering (reapply with current config).
   * Useful when page count changes.
   */
  public updateNumbering(): void {
    if (!this.initialized || !this.config.enabled) return;
    this.applyNumbering();
  }

  /**
   * Enable or disable page numbering.
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled) {
      this.applyNumbering();
    } else {
      this.removeNumbering();
    }
  }

  /**
   * Check if page numbering is currently applied.
   */
  public isApplied(): boolean {
    return this.overlays.size > 0;
  }

  /**
   * Clean up the service.
   */
  public destroy(): void {
    this.removeNumbering();
    this.container = null;
    this.domEngine = null;
    this.initialized = false;
  }

  private createOverlay(pageNumber: number, totalPages: number): HTMLElement {
    const text = this.config.format
      .replace("{page}", String(pageNumber))
      .replace("{total}", String(totalPages));

    const overlay = document.createElement("div");
    overlay.className = this.config.className;
    overlay.textContent = text;
    overlay.setAttribute("data-page-number", String(pageNumber));
    overlay.setAttribute("data-total-pages", String(totalPages));
    overlay.setAttribute("data-report-page-number-overlay", "true");

    // Base styles
    Object.assign(overlay.style, {
      position: "absolute",
      fontSize: "10px",
      color: "#6b7280",
      fontFamily: "inherit",
      pointerEvents: "none",
      zIndex: "1000",
      whiteSpace: "nowrap",
    });

    return overlay;
  }

  private positionOverlay(overlay: HTMLElement): void {
    const positionStyle = POSITION_STYLES[this.config.position];
    Object.assign(overlay.style, positionStyle);
  }
}

/**
 * Factory for creating PageNumberingService instances.
 */
export class PageNumberingServiceFactory {
  public static create(): PageNumberingService {
    return new PageNumberingService();
  }
}
