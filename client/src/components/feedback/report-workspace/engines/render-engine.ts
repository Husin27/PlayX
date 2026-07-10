import { THEME_CONFIG } from "../../../../config/theme-constants";

/**
 * RenderEngine - Concrete RenderEngine implementation [v3.3].
 * Exclusively responsible for processing raw report HTML content streams,
 * injecting theme layout variables, and executing visual mutations.
 */
export class RenderEngine {
  /**
   * Parses and injects raw HTML stream into the provided container element.
   * @param htmlStream - Raw HTML content stream to inject
   * @param container - Target HTMLDivElement container for injection
   */
  public parseAndInjectStream(
    htmlStream: string,
    container: HTMLDivElement,
  ): void {
    if (!container) return;
    container.innerHTML = htmlStream;
  }

  /**
   * Applies visual scale transformation to the container element.
   * Combines zoom percentage with scale factor for final transform.
   * Applies theme layout maxGridHeight constraint and sets transform origin.
   * @param container - Target HTMLDivElement container
   * @param scale - Base scale factor
   * @param zoom - Zoom percentage (0-100+)
   */
  public applyVisualScale(
    container: HTMLDivElement,
    scale: number,
    zoom: number,
  ): void {
    if (!container) return;
    const finalTransformScale = (zoom / 100) * scale;
    container.style.transform = `scale(${finalTransformScale})`;
    container.style.maxHeight = THEME_CONFIG.layout.maxGridHeight;
    container.style.transformOrigin = "top center";
  }

  /**
   * Toggles theme inversion classes on the container element.
   * Applies dark mode inversion classes when isDarkMode is true,
   * removes them when false.
   * @param container - Target HTMLDivElement container
   * @param isDarkMode - Boolean flag indicating dark mode state
   */
  public toggleThemeInversion(
    container: HTMLDivElement,
    isDarkMode: boolean,
  ): void {
    if (!container) return;
    if (isDarkMode) {
      container.classList.add(
        "bg-neutral-900",
        "text-neutral-100",
        "invert",
        "dark:invert-0",
      );
    } else {
      container.classList.remove(
        "bg-neutral-900",
        "text-neutral-100",
        "invert",
        "dark:invert-0",
      );
    }
  }
}
