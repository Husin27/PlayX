/**
 * DOM Engine - Single centralized source of truth for DOM query interactions.
 * No other engine or plugin is allowed to run querySelector loops directly.
 * Zero `any` usage. Strict typing throughout.
 */

import type {
  DOMEngine,
  ElementCreationOptions,
  ElementMeasurements,
  ComputedStyle,
} from "../report-types";

/**
 * Centralized DOM Engine implementation.
 * All DOM queries go through this single class.
 * No other engine or plugin should call querySelector directly.
 */
export class DOMEngineImpl implements DOMEngine {
  private container: HTMLElement | null = null;

  /**
   * Set the root container for all queries.
   * Must be called before any query methods.
   */
  public setContainer(el: HTMLElement | null): void {
    this.container = el;
  }

  // ============================================================================
  // Element Creation & Manipulation
  // ============================================================================

  public createElement(
    tag: string,
    options?: ElementCreationOptions,
  ): HTMLElement {
    const element = document.createElement(tag);

    if (options?.id) {
      element.id = options.id;
    }
    if (options?.className) {
      element.className = options.className;
    }
    if (options?.style) {
      Object.assign(element.style, options.style);
    }
    if (options?.attributes) {
      for (const [name, value] of Object.entries(options.attributes)) {
        element.setAttribute(name, value);
      }
    }
    if (options?.dataset) {
      for (const [key, value] of Object.entries(options.dataset)) {
        element.dataset[key] = value;
      }
    }
    if (options?.children) {
      for (const child of options.children) {
        element.appendChild(child);
      }
    }

    return element;
  }

  public createTextNode(text: string): Text {
    return document.createTextNode(text);
  }

  public appendChild(parent: HTMLElement, child: Node): void {
    parent.appendChild(child);
  }

  public removeChild(parent: HTMLElement, child: Node): void {
    parent.removeChild(child);
  }

  public replaceChild(
    parent: HTMLElement,
    newChild: Node,
    oldChild: Node,
  ): void {
    parent.replaceChild(newChild, oldChild);
  }

  // ============================================================================
  // Attribute & Style Manipulation
  // ============================================================================

  public setAttribute(element: HTMLElement, name: string, value: string): void {
    element.setAttribute(name, value);
  }

  public removeAttribute(element: HTMLElement, name: string): void {
    element.removeAttribute(name);
  }

  public setStyle(
    element: HTMLElement,
    property: string,
    value: string | number,
  ): void {
    element.style.setProperty(property, String(value));
  }

  public getComputedStyle(element: HTMLElement): ComputedStyle {
    const computed = window.getComputedStyle(element);
    const style: ComputedStyle = {};
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      style[prop] = computed.getPropertyValue(prop);
    }
    return style;
  }

  // ============================================================================
  // Measurement
  // ============================================================================

  public measureElement(element: HTMLElement): ElementMeasurements {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      naturalWidth: (element as HTMLImageElement).naturalWidth ?? undefined,
      naturalHeight: (element as HTMLImageElement).naturalHeight ?? undefined,
    };
  }

  // ============================================================================
  // Centralized DOM Query Methods - SINGLE SOURCE OF TRUTH
  // ============================================================================

  /**
   * Get the current container element.
   */
  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Get all report pages.
   * Selector: [data-report-page]
   */
  public getPages(): NodeListOf<HTMLElement> {
    if (!this.container) {
      return [] as unknown as NodeListOf<HTMLElement>;
    }
    return this.container.querySelectorAll<HTMLElement>("[data-report-page]");
  }

  /**
   * Get all report footers.
   * Selector: [data-report-footer]
   */
  public findFooters(): NodeListOf<HTMLElement> {
    if (!this.container) {
      return [] as unknown as NodeListOf<HTMLElement>;
    }
    return this.container.querySelectorAll<HTMLElement>("[data-report-footer]");
  }

  /**
   * Get all group elements.
   * Selector: [data-group]
   */
  public findGroups(): NodeListOf<HTMLElement> {
    if (!this.container) {
      return [] as unknown as NodeListOf<HTMLElement>;
    }
    return this.container.querySelectorAll<HTMLElement>("[data-group]");
  }

  /**
   * Get all link elements.
   * Selector: [data-link]
   */
  public findLinks(): NodeListOf<HTMLElement> {
    if (!this.container) {
      return [] as unknown as NodeListOf<HTMLElement>;
    }
    return this.container.querySelectorAll<HTMLElement>("[data-link]");
  }

  /**
   * Measure page height for pagination calculations.
   */
  public measurePageHeight(page: HTMLElement): {
    scrollHeight: number;
    clientHeight: number;
  } {
    return {
      scrollHeight: page.scrollHeight,
      clientHeight: page.clientHeight,
    };
  }

  // ============================================================================
  // Generic Query Methods (for plugins that need custom queries)
  // ============================================================================

  public querySelector(
    selector: string,
    root?: HTMLElement,
  ): HTMLElement | null {
    const searchRoot = root ?? this.container ?? document;
    return searchRoot.querySelector<HTMLElement>(selector);
  }

  public querySelectorAll(selector: string, root?: HTMLElement): HTMLElement[] {
    const searchRoot = root ?? this.container ?? document;
    return Array.from(searchRoot.querySelectorAll<HTMLElement>(selector));
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  public addEventListener(
    element: HTMLElement,
    event: string,
    handler: EventListener,
  ): void {
    element.addEventListener(event, handler);
  }

  public removeEventListener(
    element: HTMLElement,
    event: string,
    handler: EventListener,
  ): void {
    element.removeEventListener(event, handler);
  }
}

/**
 * Factory function to create a DOM engine instance.
 */
export function createDOMEngine(): DOMEngineImpl {
  return new DOMEngineImpl();
}

// ============================================================================
// Type Re-exports for convenience
// ============================================================================

export type {
  DOMEngine,
  ElementCreationOptions,
  ElementMeasurements,
  ComputedStyle,
} from "../report-types";
