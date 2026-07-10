/**
 * Tooltip Engine - Handles tooltip display and management.
 * Strictly typed, zero `any` usage.
 */

export interface TooltipConfig {
  content: string | HTMLElement;
  position?: "top" | "bottom" | "left" | "right";
  offset?: number;
  delay?: number;
}

export class TooltipEngine {
  private tooltipElement: HTMLElement | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentTarget: HTMLElement | null = null;

  /**
   * Attaches tooltip to a target element.
   * @param target - Target element to attach tooltip to
   * @param config - Tooltip configuration
   */
  public attach(target: HTMLElement, config: TooltipConfig): void {
    this.detach();

    target.addEventListener("mouseenter", () => this.show(target, config));
    target.addEventListener("mouseleave", () => this.hide());
    target.addEventListener("focus", () => this.show(target, config));
    target.addEventListener("blur", () => this.hide());
  }

  /**
   * Detaches all tooltip listeners and removes tooltip element.
   */
  public detach(): void {
    if (this.currentTarget) {
      this.currentTarget.removeEventListener("mouseenter", () => {});
      this.currentTarget.removeEventListener("mouseleave", () => {});
      this.currentTarget.removeEventListener("focus", () => {});
      this.currentTarget.removeEventListener("blur", () => {});
      this.currentTarget = null;
    }

    this.hide();
  }

  private show(target: HTMLElement, config: TooltipConfig): void {
    this.currentTarget = target;

    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }

    this.showTimeout = setTimeout(() => {
      this.createTooltip(config);
      this.positionTooltip(target, config);
      this.tooltipElement?.classList.add("visible");
    }, config.delay ?? 200);
  }

  private hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      this.tooltipElement?.classList.remove("visible");
      setTimeout(() => {
        this.tooltipElement?.remove();
        this.tooltipElement = null;
      }, 150);
    }, 100);
  }

  private createTooltip(config: TooltipConfig): void {
    if (this.tooltipElement) {
      return;
    }

    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = "report-tooltip";
    this.tooltipElement.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      max-width: 300px;
      padding: 8px 12px;
      background: #1f2937;
      color: #f9fafb;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    if (typeof config.content === "string") {
      this.tooltipElement.textContent = config.content;
    } else {
      this.tooltipElement.appendChild(config.content);
    }

    document.body.appendChild(this.tooltipElement);
  }

  private positionTooltip(target: HTMLElement, config: TooltipConfig): void {
    if (!this.tooltipElement) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const offset = config.offset ?? 8;
    const position = config.position ?? "top";

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - tooltipRect.height - offset;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - offset;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + offset;
        break;
    }

    // Clamp to viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }
}
