/**
 * Navigation Service - Centralized anchor lookups, page transitions, and scroll window management.
 * Clean boilerplate-free vanilla TypeScript core service class.
 * Ready for future plugin integration.
 */

import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "../types/plugin-types";

/**
 * Navigation target types.
 */
export interface PageAnchor {
  pageNumber: number;
  elementId: string;
  element: HTMLElement;
  label: string;
}

export interface ScrollPosition {
  x: number;
  y: number;
  pageNumber: number;
}

export interface NavigationTarget {
  type: "page" | "anchor" | "coordinate";
  pageNumber?: number;
  anchorId?: string;
  x?: number;
  y?: number;
}

/**
 * Navigation event payload.
 */
export interface NavigationEvent {
  type: "page-change" | "anchor-jump" | "scroll";
  from: NavigationTarget;
  to: NavigationTarget;
  timestamp: number;
}

/**
 * Navigation Service - Centralizes anchor lookups, page transitions, and scroll window management.
 * Prevents scattering navigation logic across standalone sub-engines.
 */
export class NavigationService {
  private currentPage = 1;
  private totalPages = 1;
  private anchors: Map<string, PageAnchor> = new Map();
  private scrollPositions: Map<number, ScrollPosition> = new Map();
  private changeListeners: Set<(event: NavigationEvent) => void> = new Set();
  private scrollContainer: HTMLElement | null = null;

  /**
   * Set the scroll container element.
   * @param container - Scroll container element
   */
  public setScrollContainer(container: HTMLElement): void {
    this.scrollContainer = container;
  }

  /**
   * Register a page anchor.
   * @param anchor - Page anchor to register
   */
  public registerAnchor(anchor: PageAnchor): void {
    this.anchors.set(anchor.elementId, anchor);
  }

  /**
   * Unregister a page anchor.
   * @param elementId - Anchor element ID
   */
  public unregisterAnchor(elementId: string): void {
    this.anchors.delete(elementId);
  }

  /**
   * Get anchor by ID.
   * @param elementId - Anchor element ID
   * @returns Page anchor or undefined
   */
  public getAnchor(elementId: string): PageAnchor | undefined {
    return this.anchors.get(elementId);
  }

  /**
   * Get all registered anchors.
   * @returns Array of all anchors
   */
  public getAllAnchors(): readonly PageAnchor[] {
    return Array.from(this.anchors.values());
  }

  /**
   * Get anchors for a specific page.
   * @param pageNumber - Page number
   * @returns Array of anchors on that page
   */
  public getAnchorsForPage(pageNumber: number): readonly PageAnchor[] {
    return Array.from(this.anchors.values()).filter(
      (a) => a.pageNumber === pageNumber,
    );
  }

  /**
   * Navigate to a specific page.
   * @param pageNumber - Target page number
   * @returns True if navigation successful
   */
  public goToPage(pageNumber: number): boolean {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return false;
    }

    const from: NavigationTarget = {
      type: "page",
      pageNumber: this.currentPage,
    };
    const to: NavigationTarget = { type: "page", pageNumber };

    this.currentPage = pageNumber;
    this.notifyChange({ type: "page-change", from, to, timestamp: Date.now() });

    // Scroll to page if container exists
    this.scrollToPage(pageNumber);

    return true;
  }

  /**
   * Navigate to next page.
   * @returns True if navigation successful
   */
  public nextPage(): boolean {
    return this.goToPage(this.currentPage + 1);
  }

  /**
   * Navigate to previous page.
   * @returns True if navigation successful
   */
  public previousPage(): boolean {
    return this.goToPage(this.currentPage - 1);
  }

  /**
   * Navigate to first page.
   * @returns True if navigation successful
   */
  public firstPage(): boolean {
    return this.goToPage(1);
  }

  /**
   * Navigate to last page.
   * @returns True if navigation successful
   */
  public lastPage(): boolean {
    return this.goToPage(this.totalPages);
  }

  /**
   * Jump to a registered anchor.
   * @param anchorId - Anchor element ID
   * @returns True if jump successful
   */
  public jumpToAnchor(anchorId: string): boolean {
    const anchor = this.anchors.get(anchorId);
    if (!anchor) {
      return false;
    }

    const from: NavigationTarget = {
      type: "page",
      pageNumber: this.currentPage,
    };
    const to: NavigationTarget = { type: "anchor", anchorId };

    this.currentPage = anchor.pageNumber;
    this.notifyChange({ type: "anchor-jump", from, to, timestamp: Date.now() });

    // Scroll to anchor element
    this.scrollToElement(anchor.element);

    return true;
  }

  /**
   * Scroll to specific coordinates.
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  public scrollTo(x: number, y: number): void {
    if (!this.scrollContainer) return;

    const from: NavigationTarget = {
      type: "coordinate",
      x: this.scrollContainer.scrollLeft,
      y: this.scrollContainer.scrollTop,
    };
    const to: NavigationTarget = { type: "coordinate", x, y };

    this.scrollContainer.scrollTo({ left: x, top: y, behavior: "smooth" });
    this.notifyChange({ type: "scroll", from, to, timestamp: Date.now() });
  }

  /**
   * Get current page number.
   * @returns Current page number
   */
  public getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * Set total pages.
   * @param total - Total number of pages
   */
  public setTotalPages(total: number): void {
    this.totalPages = Math.max(1, total);
  }

  /**
   * Get total pages.
   * @returns Total number of pages
   */
  public getTotalPages(): number {
    return this.totalPages;
  }

  /**
   * Save scroll position for a page.
   * @param pageNumber - Page number
   * @param position - Scroll position
   */
  public saveScrollPosition(
    pageNumber: number,
    position: ScrollPosition,
  ): void {
    this.scrollPositions.set(pageNumber, position);
  }

  /**
   * Get saved scroll position for a page.
   * @param pageNumber - Page number
   * @returns Scroll position or undefined
   */
  public getScrollPosition(pageNumber: number): ScrollPosition | undefined {
    return this.scrollPositions.get(pageNumber);
  }

  /**
   * Restore scroll position for current page.
   */
  public restoreScrollPosition(): void {
    const position = this.scrollPositions.get(this.currentPage);
    if (position && this.scrollContainer) {
      this.scrollContainer.scrollTo({
        left: position.x,
        top: position.y,
        behavior: "auto",
      });
    }
  }

  /**
   * Subscribe to navigation events.
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  public subscribe(listener: (event: NavigationEvent) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Scroll to a specific page.
   * @param pageNumber - Page number to scroll to
   */
  private scrollToPage(pageNumber: number): void {
    if (!this.scrollContainer) return;

    // Find first anchor on the page or estimate position
    const anchors = this.getAnchorsForPage(pageNumber);
    if (anchors.length > 0) {
      this.scrollToElement(anchors[0].element);
    } else {
      // Estimate page position based on container height
      const pageHeight = this.scrollContainer.scrollHeight / this.totalPages;
      const targetY = (pageNumber - 1) * pageHeight;
      this.scrollContainer.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }

  /**
   * Scroll to an element.
   * @param element - Element to scroll to
   */
  private scrollToElement(element: HTMLElement): void {
    if (!this.scrollContainer) return;

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Notify all listeners of navigation event.
   * @param event - Navigation event
   */
  private notifyChange(event: NavigationEvent): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Navigation event listener error:", error);
      }
    }
  }
}

/**
 * Navigation Service Factory - Creates configured navigation service instances.
 */
export class NavigationServiceFactory {
  /**
   * Create a new navigation service instance.
   * @param uiCtx - UI context (optional, for future context-aware navigation)
   * @param mutCtx - Mutable context (optional, for future context-aware navigation)
   * @returns New NavigationService instance
   */
  public static create(
    _uiCtx?: ReportWorkspaceUIContext,
    _mutCtx?: ReportWorkspaceMutableContext,
  ): NavigationService {
    return new NavigationService();
  }
}
