import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { THEME_CONFIG } from "@/config/theme-constants";
import { useReportUI, useReportEngineRef } from "./report-context";
import type {
  ReportWorkspacePlugin,
  PluginExecutionContext,
  ReportWorkspaceMutableContext,
} from "./types/plugin-types";

export interface ReportCanvasProps {
  onContainerReady?: (container: HTMLDivElement | null) => void;
  uiRef?: React.MutableRefObject<{
    zoom: number;
    currentPage: number;
    totalPages: number;
    isDarkMode: boolean;
    autoFitScale: number;
    showWarningBanner: boolean;
    htmlContent: string;
  }>;
  mutRef?: React.MutableRefObject<ReportWorkspaceMutableContext>;
  pluginMountedRef?: React.MutableRefObject<Set<string>>;
  pluginInitializedAtRef?: React.MutableRefObject<Map<string, number>>;
  pluginInstanceRef?: React.MutableRefObject<
    Map<string, ReportWorkspacePlugin>
  >;
}

export const ReportCanvas: React.FC<ReportCanvasProps> = ({
  onContainerReady,
  uiRef,
  mutRef,
  pluginMountedRef,
  pluginInitializedAtRef,
  pluginInstanceRef,
}) => {
  const ui = useReportUI();
  const engine = useReportEngineRef();

  // Track previous HTML content to detect actual changes
  // Initialize as empty string to ensure first non-empty HTML is always injected
  const prevHtmlContentRef = useRef<string>("");

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleContainerRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      containerRef.current = el;
      onContainerReady?.(el);
    },
    [onContainerReady],
  );

  // Content render effect: runs only when HTML content actually changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Only inject HTML if content actually changed
    if (prevHtmlContentRef.current !== ui.htmlContent) {
      prevHtmlContentRef.current = ui.htmlContent;
      engine.render.parseAndInjectStream(ui.htmlContent, container);

      // Discover pages after HTML injection and update totalPages
      const detectedPages = engine.dom.getPages();
      const pageCount = detectedPages.length > 0 ? detectedPages.length : 1;
      mutRef?.current?.setTotalPages(pageCount);

      // Clamp currentPage to valid range [1, totalPages]
      const currentPage = uiRef?.current?.currentPage ?? 1;
      if (currentPage > pageCount) {
        mutRef?.current?.setCurrentPage(pageCount);
      } else if (currentPage < 1) {
        mutRef?.current?.setCurrentPage(1);
      }

      // Run AutoFit after HTML injection and page discovery
      const isCleanFit = engine.runAutoFitSequence((scale) => {
        mutRef?.current?.setAutoFitScale(scale);
      });
      mutRef?.current?.setShowWarningBanner(!isCleanFit);

      // Trigger onDOMRender for mounted plugins after HTML injection
      if (
        uiRef &&
        mutRef &&
        pluginMountedRef &&
        pluginInitializedAtRef &&
        pluginInstanceRef
      ) {
        for (const plugin of pluginInstanceRef.current.values()) {
          if (pluginMountedRef.current.has(plugin.id)) {
            const initializedAt =
              pluginInitializedAtRef.current.get(plugin.id) ?? Date.now();
            const ctx: PluginExecutionContext = {
              pluginId: plugin.id,
              pluginName: plugin.name,
              uiContext: uiRef.current,
              mutableContext: mutRef.current,
              initializedAt,
              metadata: new Map(),
            };
            plugin.onDOMRender?.(container, uiRef.current, ctx);
          }
        }
      }
    }
  }, [
    ui.htmlContent,
    engine,
    uiRef,
    mutRef,
    pluginMountedRef,
    pluginInitializedAtRef,
    pluginInstanceRef,
  ]);

  // Visual update effect: runs only on zoom, AutoFit scale, or dark mode changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    engine.render.applyVisualScale(container, ui.autoFitScale, ui.zoom);
    engine.render.toggleThemeInversion(container, ui.isDarkMode);
  }, [ui.zoom, ui.autoFitScale, ui.isDarkMode, engine]);

  return (
    <div className="flex-1 overflow-auto p-8 flex flex-col items-center bg-background/30 relative min-h-[400px]">
      <div
        ref={handleContainerRef}
        className={cn(
          "bg-white text-black shadow-2xl transition-transform duration-200 ease-out origin-top",
          ui.isDarkMode &&
            "bg-neutral-900 text-neutral-100 invert dark:invert-0",
        )}
        style={{
          width: "816px",
          maxHeight: THEME_CONFIG.layout.maxGridHeight,
        }}
      />
    </div>
  );
};
