import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useReportUI, useReportMutable } from "./report-context";
import type { ReportWorkspacePlugin } from "./types/plugin-types";
import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "./types/plugin-types";
import {
  ActionRegistry,
  getDefaultCoreRegistry,
} from "./services/action-registry";

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
  const {
    zoom,
    isDarkMode,
    currentPage,
    totalPages,
    autoFitScale,
    showWarningBanner,
    htmlContent,
  } = useReportUI();
  const {
    setZoom,
    setIsDarkMode,
    setCurrentPage,
    triggerAutoFit,
    setAutoFitScale,
    setShowWarningBanner,
  } = useReportMutable();

  const uiCtx = useMemo<ReportWorkspaceUIContext>(
    () => ({
      zoom,
      isDarkMode,
      currentPage,
      totalPages,
      autoFitScale,
      showWarningBanner,
      htmlContent,
    }),
    [
      zoom,
      isDarkMode,
      currentPage,
      totalPages,
      autoFitScale,
      showWarningBanner,
      htmlContent,
    ],
  );

  const mutCtx = useMemo<ReportWorkspaceMutableContext>(
    () => ({
      setZoom,
      setCurrentPage,
      setIsDarkMode,
      setAutoFitScale,
      setShowWarningBanner,
      triggerAutoFit,
    }),
    [
      setZoom,
      setCurrentPage,
      setIsDarkMode,
      setAutoFitScale,
      setShowWarningBanner,
      triggerAutoFit,
    ],
  );

  // Get merged action registry (core + plugins)
  const actionRegistry = useMemo(() => {
    const coreRegistry = getDefaultCoreRegistry(uiCtx, mutCtx);
    const pluginRegistries = plugins
      .filter((p) => p.renderToolbarAction)
      .map((plugin) => {
        const registry = new ActionRegistry();
        // Plugin toolbar actions are rendered directly as React nodes
        // The registry merger handles core + plugin actions
        plugin.renderToolbarAction?.({
          ...uiCtx,
          ...mutCtx,
        });
        return registry;
      });
    return ActionRegistry.merge(coreRegistry, ...pluginRegistries);
  }, [plugins, uiCtx, mutCtx]);

  // Get toolbar actions from registry
  const toolbarActions = useMemo(
    () => actionRegistry.getToolbarActions(uiCtx),
    [actionRegistry, uiCtx],
  );

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

      {/* Render action groups from registry */}
      {actionRegistry.getGroups().map((group) => {
        const groupActions = toolbarActions.filter((a) => a.group === group.id);
        if (groupActions.length === 0) return null;

        return (
          <div
            key={group.id}
            className="flex items-center gap-2 border-l border-border pl-3"
          >
            {groupActions.map((action) => (
              <button
                key={action.id}
                onClick={() => action.action(uiCtx, mutCtx)}
                disabled={
                  action.enabled === false ||
                  (typeof action.enabled === "function" &&
                    !action.enabled(uiCtx))
                }
                className="p-1 hover:bg-accent rounded"
                title={action.label}
              >
                {action.icon ?? action.label}
              </button>
            ))}
          </div>
        );
      })}

      {/* Plugin custom toolbar actions (rendered as React nodes) */}
      <div className="flex items-center gap-1 ml-auto">
        {plugins.map((plugin) =>
          plugin.renderToolbarAction?.({ ...uiCtx, ...mutCtx }),
        )}
      </div>
    </div>
  );
};

export default ReportToolbar;
