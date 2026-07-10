/**
 * Hyperlink Engine - Handles hyperlink binding and click delegation.
 * Strictly typed, zero `any` usage.
 */

import type { DOMEngine } from "./dom-engine";

export interface HyperlinkClickHandler {
  (type: string, id: string): void;
}

export class HyperlinkEngine {
  private bound = false;
  private handler: HyperlinkClickHandler | null = null;

  /**
   * Binds click delegation for hyperlinks.
   * @param dom - DOM engine instance
   * @param onLinkClick - Callback when a link is clicked
   */
  public bind(dom: DOMEngine, onLinkClick: HyperlinkClickHandler): void {
    if (this.bound) {
      return; // Already bound
    }

    const container = dom.getContainer();
    if (!container) {
      return;
    }

    this.handler = onLinkClick;

    container.addEventListener("click", this.handleClick.bind(this));
    this.bound = true;
  }

  /**
   * Unbinds click delegation.
   * @param dom - DOM engine instance
   */
  public unbind(dom: DOMEngine): void {
    if (!this.bound) {
      return;
    }

    const container = dom.getContainer();
    if (container && this.handler) {
      container.removeEventListener("click", this.handleClick.bind(this));
    }

    this.bound = false;
    this.handler = null;
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLElement>("[data-link]");

    if (!link || !this.handler) {
      return;
    }

    const type = link.dataset.linkType;
    const id = link.dataset.linkId;

    if (type && id) {
      event.preventDefault();
      this.handler(type, id);
    }
  }
}
