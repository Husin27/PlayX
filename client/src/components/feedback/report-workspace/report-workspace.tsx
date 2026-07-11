import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
  ReportWorkspacePlugin,
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
    const [zoom, setZoom] = useState<number>(100);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [autoFitScale, setAutoFitScale] = useState<number>(1);
    const [showWarningBanner, setShowWarningBanner] = useState<boolean>(false);

    const engine = useMemo(() => new ReportEngine(), []);

    const uiRef = useRef<ReportWorkspaceUIContext>({
      zoom,
      currentPage,
      totalPages,
      isDarkMode,
      autoFitScale,
      showWarningBanner,
      htmlContent: htmlReportStream,
    });
    const mutRef = useRef<ReportWorkspaceMutableContext>({
      setZoom,
      setCurrentPage,
      setIsDarkMode,
      setAutoFitScale,
      setShowWarningBanner,
      triggerAutoFit: () => {
        const isCleanFit = engine.runAutoFitSequence(setAutoFitScale);
        if (!isCleanFit) setShowWarningBanner(true);
      },
    });

    uiRef.current = {
      zoom,
      currentPage,
      totalPages,
      isDarkMode,
      autoFitScale,
      showWarningBanner,
      htmlContent: htmlReportStream,
    };
    mutRef.current = {
      setZoom,
      setCurrentPage,
      setIsDarkMode,
      setAutoFitScale,
      setShowWarningBanner,
      triggerAutoFit: () => {
        const isCleanFit = engine.runAutoFitSequence(setAutoFitScale);
        if (!isCleanFit) setShowWarningBanner(true);
      },
    };

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
      (): ReportWorkspaceMutableContext => mutRef.current,
      [engine],
    );

    const reportRootRef = useRef<HTMLDivElement | null>(null);
    const isMountedRef = useRef(false);
    const onLinkClickRef = useRef(onLinkClick);
    onLinkClickRef.current = onLinkClick;

    const handleContainerReady = useCallback(
      (container: HTMLDivElement | null) => {
        reportRootRef.current = container;
      },
      [],
    );

    const pluginMountedRef = useRef<Set<string>>(new Set());
    const pluginInstanceRef = useRef<Map<string, ReportWorkspacePlugin>>(
      new Map(),
    );
    const pluginInitializedAtRef = useRef<Map<string, number>>(new Map());
    const pluginInitializedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      const currentIds = new Set(plugins.map((p) => p.id));
      const prevIds = new Set(pluginInstanceRef.current.keys());

      for (const prevId of prevIds) {
        if (!currentIds.has(prevId)) {
          const oldPlugin = pluginInstanceRef.current.get(prevId);
          const initializedAt = pluginInitializedAtRef.current.get(prevId);
          if (oldPlugin) {
            if (pluginMountedRef.current.has(prevId)) {
              const container = reportRootRef.current;
              if (container) {
                oldPlugin.onUnmounted?.(container, {
                  pluginId: prevId,
                  pluginName: oldPlugin.name,
                  uiContext: uiRef.current,
                  mutableContext: mutRef.current,
                  initializedAt: initializedAt ?? Date.now(),
                  metadata: new Map(),
                });
                pluginMountedRef.current.delete(prevId);
              }
            }
            oldPlugin.onDestroy?.({
              pluginId: prevId,
              pluginName: oldPlugin.name,
              uiContext: uiRef.current,
              mutableContext: mutRef.current,
              initializedAt: initializedAt ?? Date.now(),
              metadata: new Map(),
            });
            pluginInstanceRef.current.delete(prevId);
            pluginInitializedAtRef.current.delete(prevId);
            pluginInitializedRef.current.delete(prevId);
          }
        }
      }

      for (const plugin of plugins) {
        const prevPlugin = pluginInstanceRef.current.get(plugin.id);
        const isNew = !prevPlugin;
        const isReplaced = prevPlugin && prevPlugin !== plugin;

        if (isReplaced) {
          if (pluginMountedRef.current.has(prevPlugin.id)) {
            const container = reportRootRef.current;
            if (container) {
              prevPlugin.onUnmounted?.(container, {
                pluginId: prevPlugin.id,
                pluginName: prevPlugin.name,
                uiContext: uiRef.current,
                mutableContext: mutRef.current,
                initializedAt:
                  pluginInitializedAtRef.current.get(prevPlugin.id) ??
                  Date.now(),
                metadata: new Map(),
              });
              pluginMountedRef.current.delete(prevPlugin.id);
            }
            prevPlugin.onDestroy?.({
              pluginId: prevPlugin.id,
              pluginName: prevPlugin.name,
              uiContext: uiRef.current,
              mutableContext: mutRef.current,
              initializedAt:
                pluginInitializedAtRef.current.get(prevPlugin.id) ?? Date.now(),
              metadata: new Map(),
            });
          }
        }

        if (isNew || isReplaced) {
          const initializedAt = Date.now();
          pluginInitializedAtRef.current.set(plugin.id, initializedAt);
          pluginInstanceRef.current.set(plugin.id, plugin);
          pluginInitializedRef.current.add(plugin.id);
          plugin.onInit?.(uiRef.current, mutRef.current);

          if (isMountedRef.current) {
            const container = reportRootRef.current;
            if (container) {
              plugin.onMounted?.(container, uiRef.current, {
                pluginId: plugin.id,
                pluginName: plugin.name,
                uiContext: uiRef.current,
                mutableContext: mutRef.current,
                initializedAt,
                mountedAt: Date.now(),
                metadata: new Map(),
              });
              pluginMountedRef.current.add(plugin.id);
            }
          }
        }
      }
    }, [plugins]);

    useEffect(() => {
      const container = reportRootRef.current;
      if (!container || isMountedRef.current) return;

      isMountedRef.current = true;
      engine.mount(container);
      engine.bindCoreListeners((type, id) =>
        onLinkClickRef.current?.(type, id),
      );

      const detectedPages = engine.dom.getPages();
      if (detectedPages.length > 0) setTotalPages(detectedPages.length);

      for (const [pluginId, plugin] of pluginInstanceRef.current) {
        if (!pluginMountedRef.current.has(pluginId)) {
          const initializedAt =
            pluginInitializedAtRef.current.get(pluginId) ?? Date.now();
          plugin.onMounted?.(container, uiRef.current, {
            pluginId,
            pluginName: plugin.name,
            uiContext: uiRef.current,
            mutableContext: mutRef.current,
            initializedAt,
            mountedAt: Date.now(),
            metadata: new Map(),
          });
          pluginMountedRef.current.add(pluginId);
        }
      }

      return () => {
        for (const pluginId of pluginMountedRef.current) {
          const plugin = pluginInstanceRef.current.get(pluginId);
          if (plugin) {
            plugin.onUnmounted?.(container, {
              pluginId,
              pluginName: plugin.name,
              uiContext: uiRef.current,
              mutableContext: mutRef.current,
              initializedAt:
                pluginInitializedAtRef.current.get(pluginId) ?? Date.now(),
              metadata: new Map(),
            });
          }
        }
        pluginMountedRef.current.clear();

        engine.unmount();
        isMountedRef.current = false;

        for (const [pluginId, plugin] of pluginInstanceRef.current) {
          const initializedAt = pluginInitializedAtRef.current.get(pluginId);
          plugin.onDestroy?.({
            pluginId,
            pluginName: plugin.name,
            uiContext: uiRef.current,
            mutableContext: mutRef.current,
            initializedAt: initializedAt ?? Date.now(),
            metadata: new Map(),
          });
        }
        pluginInstanceRef.current.clear();
        pluginInitializedAtRef.current.clear();
        pluginInitializedRef.current.clear();
      };
    }, [engine]);

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
              <ReportToolbar
                reportTitle={reportTitle}
                hint={hint}
                plugins={plugins}
              />
              <div className="relative flex flex-col w-full flex-1 overflow-hidden">
                <ReportCanvas
                  onContainerReady={handleContainerReady}
                  uiRef={uiRef}
                  mutRef={mutRef}
                  pluginMountedRef={pluginMountedRef}
                  pluginInitializedAtRef={pluginInitializedAtRef}
                  pluginInstanceRef={pluginInstanceRef}
                />
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
