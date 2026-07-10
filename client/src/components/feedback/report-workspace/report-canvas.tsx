import React, { useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { THEME_CONFIG } from "@/config/theme-constants";
import {
  useReportUI,
  useReportEngineRef,
  useReportMutable,
} from "./report-context";
import type { ReportWorkspacePlugin } from "./types/plugin-types";
import type { PluginExecutionContext } from "./types/plugin-types";

export interface ReportCanvasProps {
  plugins?: ReportWorkspacePlugin[];
}

export const ReportCanvas: React.FC<ReportCanvasProps> = ({ plugins = [] }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const ui = useReportUI();
  const mut = useReportMutable();
  const engine = useReportEngineRef();

  // Create execution context for plugins
  const executionContext = useMemo<PluginExecutionContext>(
    () => ({
      pluginId: "",
      pluginName: "",
      uiContext: ui,
      mutableContext: mut,
      initializedAt: Date.now(),
      metadata: new Map(),
    }),
    [ui, mut],
  );

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    // Delegate rendering injection and mutations straight into the new RenderEngine
    engine.render.parseAndInjectStream(ui.htmlContent, container);
    engine.render.applyVisualScale(container, ui.autoFitScale, ui.zoom);
    engine.render.toggleThemeInversion(container, ui.isDarkMode);

    // Invoke active plugins render pass cleanly with execution context
    plugins.forEach((plugin) => {
      const ctx: PluginExecutionContext = {
        ...executionContext,
        pluginId: plugin.id,
        pluginName: plugin.name,
      };
      plugin.onDOMRender?.(container, ui, ctx);
    });
  }, [
    ui.htmlContent,
    ui.zoom,
    ui.autoFitScale,
    ui.isDarkMode,
    engine,
    plugins,
    executionContext,
  ]);

  return (
    <div className="flex-1 overflow-auto p-8 flex flex-col items-center bg-background/30 relative min-h-[400px]">
      <div
        ref={canvasRef}
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
