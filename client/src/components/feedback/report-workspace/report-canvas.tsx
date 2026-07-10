import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { THEME_CONFIG } from "@/config/theme-constants";
import { useReportUI, useReportEngineRef } from "./report-context";
import { ReportWorkspacePlugin } from "./report-plugins-core";

export interface ReportCanvasProps {
  plugins?: ReportWorkspacePlugin[];
}

export const ReportCanvas: React.FC<ReportCanvasProps> = ({ plugins = [] }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const ui = useReportUI();
  const engine = useReportEngineRef();

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    // Delegate rendering injection and mutations straight into the new RenderEngine
    engine.render.parseAndInjectStream(ui.htmlContent, container);
    engine.render.applyVisualScale(container, ui.autoFitScale, ui.zoom);
    engine.render.toggleThemeInversion(container, ui.isDarkMode);

    // Invoke active plugins render pass cleanly
    plugins.forEach((plugin) => plugin.onDOMRender?.(container, ui));
  }, [
    ui.htmlContent,
    ui.zoom,
    ui.autoFitScale,
    ui.isDarkMode,
    engine,
    plugins,
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
