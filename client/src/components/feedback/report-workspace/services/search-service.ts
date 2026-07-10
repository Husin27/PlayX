/**
 * Search Service - Framework loop abstraction for text search highlights.
 * Clean boilerplate-free vanilla TypeScript core service class.
 * Ready for future plugin integration.
 */

import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "../types/plugin-types";

/**
 * Search match result.
 */
export interface SearchMatch {
  index: number;
  element: HTMLElement;
  text: string;
  context: string;
  pageNumber: number;
  position: { x: number; y: number };
}

/**
 * Search options.
 */
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  maxResults?: number;
}

/**
 * Search event payload.
 */
export interface SearchEvent {
  type: "search-start" | "search-complete" | "match-found" | "match-cleared";
  query: string;
  matches?: readonly SearchMatch[];
  currentMatchIndex?: number;
  timestamp: number;
}

/**
 * Search Service - Structures the framework loop abstraction for text search highlights.
 * Provides findMatch, nextMatch, previousMatch operations.
 */
export class SearchService {
  private currentQuery = "";
  private matches: SearchMatch[] = [];
  private currentMatchIndex = -1;
  private options: SearchOptions = {};
  private changeListeners: Set<(event: SearchEvent) => void> = new Set();
  private searchContainer: HTMLElement | null = null;
  private highlightClass = "search-highlight";
  private currentHighlightClass = "search-highlight-current";

  /**
   * Set the search container element.
   * @param container - Container to search within
   */
  public setSearchContainer(container: HTMLElement): void {
    this.searchContainer = container;
  }

  /**
   * Set search options.
   * @param options - Search options
   */
  public setOptions(options: SearchOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current search options.
   * @returns Current search options
   */
  public getOptions(): Readonly<SearchOptions> {
    return { ...this.options };
  }

  /**
   * Find matches for a query.
   * @param query - Search query string
   * @returns Array of search matches
   */
  public findMatch(query: string): readonly SearchMatch[] {
    this.clearHighlights();
    this.currentQuery = query;
    this.currentMatchIndex = -1;

    if (!query.trim() || !this.searchContainer) {
      this.matches = [];
      this.notifyChange({
        type: "search-complete",
        query,
        matches: [],
        timestamp: Date.now(),
      });
      return [];
    }

    this.notifyChange({ type: "search-start", query, timestamp: Date.now() });

    const matches = this.performSearch(query);
    this.matches = matches.slice(0, this.options.maxResults ?? 1000);

    this.applyHighlights();

    this.notifyChange({
      type: "search-complete",
      query,
      matches: this.matches,
      timestamp: Date.now(),
    });

    return this.matches;
  }

  /**
   * Navigate to next match.
   * @returns Current match or null if none
   */
  public nextMatch(): SearchMatch | null {
    if (this.matches.length === 0) return null;

    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
    this.updateCurrentHighlight();

    const match = this.matches[this.currentMatchIndex];
    this.notifyChange({
      type: "match-found",
      query: this.currentQuery,
      matches: this.matches,
      currentMatchIndex: this.currentMatchIndex,
      timestamp: Date.now(),
    });

    this.scrollToMatch(match);
    return match;
  }

  /**
   * Navigate to previous match.
   * @returns Current match or null if none
   */
  public previousMatch(): SearchMatch | null {
    if (this.matches.length === 0) return null;

    this.currentMatchIndex =
      (this.currentMatchIndex - 1 + this.matches.length) % this.matches.length;
    this.updateCurrentHighlight();

    const match = this.matches[this.currentMatchIndex];
    this.notifyChange({
      type: "match-found",
      query: this.currentQuery,
      matches: this.matches,
      currentMatchIndex: this.currentMatchIndex,
      timestamp: Date.now(),
    });

    this.scrollToMatch(match);
    return match;
  }

  /**
   * Go to a specific match by index.
   * @param index - Match index
   * @returns Match at index or null
   */
  public goToMatch(index: number): SearchMatch | null {
    if (index < 0 || index >= this.matches.length) return null;

    this.currentMatchIndex = index;
    this.updateCurrentHighlight();

    const match = this.matches[index];
    this.notifyChange({
      type: "match-found",
      query: this.currentQuery,
      matches: this.matches,
      currentMatchIndex: this.currentMatchIndex,
      timestamp: Date.now(),
    });

    this.scrollToMatch(match);
    return match;
  }

  /**
   * Clear all search highlights and results.
   */
  public clearSearch(): void {
    this.clearHighlights();
    this.matches = [];
    this.currentMatchIndex = -1;
    this.currentQuery = "";
    this.notifyChange({
      type: "match-cleared",
      query: "",
      timestamp: Date.now(),
    });
  }

  /**
   * Get current query.
   * @returns Current search query
   */
  public getQuery(): string {
    return this.currentQuery;
  }

  /**
   * Get all matches.
   * @returns Array of all matches
   */
  public getMatches(): readonly SearchMatch[] {
    return [...this.matches];
  }

  /**
   * Get current match index.
   * @returns Current match index (-1 if none)
   */
  public getCurrentMatchIndex(): number {
    return this.currentMatchIndex;
  }

  /**
   * Get total match count.
   * @returns Number of matches
   */
  public getMatchCount(): number {
    return this.matches.length;
  }

  /**
   * Check if there are active search results.
   * @returns True if matches exist
   */
  public hasMatches(): boolean {
    return this.matches.length > 0;
  }

  /**
   * Subscribe to search events.
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  public subscribe(listener: (event: SearchEvent) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Perform the actual text search within the container.
   * @param query - Search query
   * @returns Array of search matches
   */
  private performSearch(query: string): SearchMatch[] {
    if (!this.searchContainer) return [];

    const matches: SearchMatch[] = [];
    const walker = document.createTreeWalker(
      this.searchContainer,
      NodeFilter.SHOW_TEXT,
      null,
    );

    const searchText = this.options.caseSensitive ? query : query.toLowerCase();
    let matchIndex = 0;

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const text = this.options.caseSensitive
        ? (textNode.textContent ?? "")
        : (textNode.textContent ?? "").toLowerCase();

      let index = 0;
      while ((index = text.indexOf(searchText, index)) !== -1) {
        const element = textNode.parentElement;
        if (element && this.isVisible(element)) {
          const context = this.getContext(text, index, query.length);
          const position = this.getElementPosition(element);
          const pageNumber = this.getPageNumber(element);

          matches.push({
            index: matchIndex++,
            element,
            text: textNode.textContent ?? "",
            context,
            pageNumber,
            position,
          });
        }
        index += query.length;
      }
    }

    return matches;
  }

  /**
   * Check if element is visible.
   * @param element - Element to check
   * @returns True if visible
   */
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  /**
   * Get context around match.
   * @param text - Full text
   * @param index - Match index
   * @param length - Match length
   * @returns Context string
   */
  private getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + length + 50);
    return text.substring(start, end);
  }

  /**
   * Get element position relative to container.
   * @param element - Element
   * @returns Position object
   */
  private getElementPosition(element: HTMLElement): { x: number; y: number } {
    if (!this.searchContainer) return { x: 0, y: 0 };

    const containerRect = this.searchContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return {
      x:
        elementRect.left - containerRect.left + this.searchContainer.scrollLeft,
      y: elementRect.top - containerRect.top + this.searchContainer.scrollTop,
    };
  }

  /**
   * Get page number for element.
   * @param element - Element
   * @returns Page number (1-based)
   */
  private getPageNumber(element: HTMLElement): number {
    // Try to find page container
    let current: HTMLElement | null = element;
    while (current && current !== this.searchContainer) {
      const pageAttr = current.getAttribute("data-page-number");
      if (pageAttr) {
        return parseInt(pageAttr, 10);
      }
      current = current.parentElement;
    }
    return 1;
  }

  /**
   * Apply highlights to all matches.
   */
  private applyHighlights(): void {
    for (const match of this.matches) {
      this.highlightElement(match.element);
    }
  }

  /**
   * Highlight a single element.
   * @param element - Element to highlight
   */
  private highlightElement(element: HTMLElement): void {
    element.classList.add(this.highlightClass);
  }

  /**
   * Update current match highlight.
   */
  private updateCurrentHighlight(): void {
    // Remove current highlight from all
    for (const match of this.matches) {
      match.element.classList.remove(this.currentHighlightClass);
    }

    // Add to current
    if (
      this.currentMatchIndex >= 0 &&
      this.currentMatchIndex < this.matches.length
    ) {
      this.matches[this.currentMatchIndex].element.classList.add(
        this.currentHighlightClass,
      );
    }
  }

  /**
   * Clear all highlights.
   */
  private clearHighlights(): void {
    if (!this.searchContainer) return;

    const highlighted = this.searchContainer.querySelectorAll(
      `.${this.highlightClass}, .${this.currentHighlightClass}`,
    );
    for (const el of highlighted) {
      el.classList.remove(this.highlightClass, this.currentHighlightClass);
    }
  }

  /**
   * Scroll to match element.
   * @param match - Match to scroll to
   */
  private scrollToMatch(match: SearchMatch): void {
    if (!this.searchContainer) return;

    match.element.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /**
   * Notify all listeners of search event.
   * @param event - Search event
   */
  private notifyChange(event: SearchEvent): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Search event listener error:", error);
      }
    }
  }
}

/**
 * Search Service Factory - Creates configured search service instances.
 */
export class SearchServiceFactory {
  /**
   * Create a new search service instance.
   * @param uiCtx - UI context (optional, for future context-aware search)
   * @param mutCtx - Mutable context (optional, for future context-aware search)
   * @returns New SearchService instance
   */
  public static create(
    _uiCtx?: ReportWorkspaceUIContext,
    _mutCtx?: ReportWorkspaceMutableContext,
  ): SearchService {
    return new SearchService();
  }
}
