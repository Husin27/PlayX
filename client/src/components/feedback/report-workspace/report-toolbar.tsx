import React from "react";
import { cn } from "@/lib/utils";
import { useReportUI, useReportMutable } from "./report-context";
import type { ReportWorkspacePlugin } from "./report-plugins-core";
import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "./types/plugin-types";

export interface ReportToolbarProps {
  reportTitle?: string;
  hint?: string;
  plugins?: ReportWorkspacePlugin[];
}

export const ReportToolbar: React.FC<ReportToolbarProps> = ({
  reportTitle = "Report",
  hint,
  plugins = [],
}) => {
  const { zoom, isDarkMode, currentPage, totalPages } = useReportUI();
  const { setZoom, setIsDarkMode, setCurrentPage, triggerAutoFit } =
    useReportMutable();

  const handleZoomIn = () => setZoom((z: number) => Math.min(z + 10, 200));
  const handleZoomOut = () => setZoom((z: number) => Math.max(z - 10, 50));
  const handleZoomReset = () => setZoom(100);
  const handleToggleTheme = () => setIsDarkMode((d: boolean) => !d);
  const handlePrevPage = () =>
    setCurrentPage((p: number) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p: number) => Math.min(p + 1, totalPages));
  const handleAutoFit = () => triggerAutoFit();

  const uiCtx = {
    zoom,
    isDarkMode,
    currentPage,
    totalPages,
    autoFitScale: 1,
    showWarningBanner: false,
    htmlContent: "",
  } as ReportWorkspaceUIContext;
  const mutCtx = {
    setZoom,
    setCurrentPage,
    setIsDarkMode,
    triggerAutoFit,
  } as ReportWorkspaceMutableContext;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 border-b border-border bg-card/50",
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h2 className="text-sm font-medium text-foreground flex-1 truncate">
          {reportTitle}
        </h2>
        {hint && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {hint}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <button
          onClick={handleZoomOut}
          className="p-1 hover:bg-accent rounded"
          title="Zoom Out"
        >
          −
        </button>
        <span className="w-16 text-center text-sm font-mono">{zoom}%</span>
        <button
          onClick={handleZoomIn}
          className="p-1 hover:bg-accent rounded"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomReset}
          className="p-1 hover:bg-accent rounded"
          title="Reset Zoom"
        >
          100%
        </button>
        <button
          onClick={handleAutoFit}
          className="p-1 hover:bg-accent rounded"
          title="Auto Fit"
        >
          ⛶
        </button>
      </div>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <button
          onClick={handleToggleTheme}
          className="p-1 hover:bg-accent rounded"
          title="Toggle Theme"
        >
          {isDarkMode ? "☀" : "🌙"}
        </button>
      </div>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="p-1 hover:bg-accent rounded disabled:opacity-50"
          title="Previous Page"
        >
          ←
        </button>
        <span className="text-sm text-muted-foreground w-24 text-center">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="p-1 hover:bg-accent rounded disabled:opacity-50"
          title="Next Page"
        >
          →
        </button>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        {plugins.map((plugin) =>
          plugin.renderToolbarAction?.({ ...uiCtx, ...mutCtx }),
        )}
      </div>
    </div>
  );
};

export default ReportToolbar;
