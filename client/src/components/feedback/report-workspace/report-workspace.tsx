import React, { forwardRef, useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { UIContext, MutableContext, EngineContext } from "./report-context";
import { ReportEngine } from "./engines/report-engine";
import { ReportToolbar } from "./report-toolbar";
import { ReportCanvas } from "./report-canvas";
import { ReportWarningBar } from "./report-warning-bar";
import type { ReportWorkspaceProps } from "./types/workspace-types";
import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "./types/plugin-types";

export const ReportWorkspace = forwardRef<HTMLDivElement, ReportWorkspaceProps>(
  (
    {
      htmlReportStream,
      reportTitle,
      hint,
      popupMenu,
      plugins = [],
      onLinkClick,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState<number>(100);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [autoFitScale, setAutoFitScale] = useState<number>(1);
    const [showWarningBanner, setShowWarningBanner] = useState<boolean>(false);

    // 🔒 IMMUTABLE MASTER ORCHESTRATOR CORE INSTANTIATION
    const engine = useMemo(() => new ReportEngine(), []);

    const uiCtx = useMemo(
      (): ReportWorkspaceUIContext => ({
        zoom,
        currentPage,
        totalPages,
        isDarkMode,
        autoFitScale,
        showWarningBanner,
        htmlContent: htmlReportStream,
      }),
      [
        zoom,
        currentPage,
        totalPages,
        isDarkMode,
        autoFitScale,
        showWarningBanner,
        htmlReportStream,
      ],
    );

    const mutCtx = useMemo(
      (): ReportWorkspaceMutableContext => ({
        setZoom,
        setCurrentPage,
        setIsDarkMode,
        setAutoFitScale,
        setShowWarningBanner,
        triggerAutoFit: () => {
          const isCleanFit = engine.runAutoFitSequence(setAutoFitScale);
          if (!isCleanFit) setShowWarningBanner(true);
        },
      }),
      [engine],
    );

    useEffect(() => {
      plugins.forEach((plugin) => plugin.onInit?.(uiCtx, mutCtx));
    }, [plugins, uiCtx, mutCtx]);

    useEffect(() => {
      const container = canvasContainerRef.current;
      if (!container) return;

      engine.mount(container);
      engine.bindCoreListeners(onLinkClick);

      const detectedPages = engine.dom.getPages();
      if (detectedPages.length > 0) setTotalPages(detectedPages.length);

      plugins.forEach((plugin) => plugin.onMounted?.(container, uiCtx));

      return () => {
        plugins.forEach((plugin) => plugin.onUnmounted?.(container));
        engine.unmount();
      };
    }, [htmlReportStream, plugins, uiCtx, engine, onLinkClick]);

    return (
      <EngineContext.Provider value={engine}>
        <UIContext.Provider value={uiCtx}>
          <MutableContext.Provider value={mutCtx}>
            <div
              ref={ref}
              className={cn(
                "relative flex flex-col w-full overflow-hidden rounded-lg border border-[color-mix(in_oklch,var(--color-border)_40%,transparent)] bg-card",
                className,
              )}
              onContextMenu={(e) => {
                e.preventDefault();
                popupMenu?.trigger(e);
              }}
              style={style}
              {...props}
            >
              {/* 🟢 PASS HINT PROPERTY DIRECTLY TO THE TOOLBAR COMPONENT TO EXTINGUISH ESLINT WARNING */}
              <ReportToolbar
                reportTitle={reportTitle}
                hint={hint}
                plugins={plugins}
              />
              <div
                ref={canvasContainerRef}
                className="relative flex flex-col w-full flex-1 overflow-hidden"
              >
                <ReportCanvas plugins={plugins} />
                <ReportWarningBar />
              </div>
            </div>
          </MutableContext.Provider>
        </UIContext.Provider>
      </EngineContext.Provider>
    );
  },
);

ReportWorkspace.displayName = "ReportWorkspace";
export default ReportWorkspace;
