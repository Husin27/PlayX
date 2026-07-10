/**
 * AutoFit Engine - Handles automatic fitting/scaling of report content.
 * Strictly typed, zero `any` usage.
 */

import type { DOMEngine } from "./dom-engine";

export class AutoFitEngine {
  /**
   * Runs an auto-fit session to calculate and apply optimal scale.
   * @param dom - DOM engine instance for measurements
   * @param applyScaleCallback - Callback to apply the calculated scale
   * @returns true if auto-fit was successful, false otherwise
   */
  public runSession(
    dom: DOMEngine,
    applyScaleCallback: (scale: number) => void,
  ): boolean {
    const container = dom.getContainer();
    if (!container) {
      return false;
    }

    const pages = dom.getPages();
    if (pages.length === 0) {
      return false;
    }

    // Calculate optimal scale based on container and content dimensions
    const containerRect = container.getBoundingClientRect();
    let maxContentWidth = 0;
    let maxContentHeight = 0;

    pages.forEach((page) => {
      const rect = page.getBoundingClientRect();
      maxContentWidth = Math.max(maxContentWidth, rect.width);
      maxContentHeight = Math.max(maxContentHeight, rect.height);
    });

    if (maxContentWidth === 0 || maxContentHeight === 0) {
      return false;
    }

    const scaleX = containerRect.width / maxContentWidth;
    const scaleY = containerRect.height / maxContentHeight;
    const optimalScale = Math.min(scaleX, scaleY) * 0.95; // 95% to add small padding

    applyScaleCallback(Math.max(0.1, Math.min(optimalScale, 5))); // Clamp between 10% and 500%

    return true;
  }
}
