import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import {
  LucideIcon,
  Copy,
  Minimize2,
  Maximize2,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../general/button";
import { HintBox } from "./hint-box";
import {
  PopupMenu,
  type PopupMenuConfig,
  type PopupMenuItem,
} from "./popup-menu";
import { THEME_CONFIG, type TactileConfig } from "@/config/theme-constants";
import type {
  ReportWorkspaceContext,
  ReportWorkspacePlugin,
} from "./report-plugins-core";

// ⛩️ LOCAL TYPE ISOLATION GATEWAY
export interface ReportWorkspaceProps extends React.HTMLAttributes<HTMLDivElement> {
  htmlReportStream: string;
  reportTitle: string;
  hint?: string;
  plugins?: ReadonlyArray<Readonly<ReportWorkspacePlugin>>;
  onLinkClick?: (type: string, id: string) => void;
}

interface ReportPageMetrics {
  pageElement: HTMLDivElement;
  scrollHeight: number;
  clientHeight: number;
  footerElement: HTMLElement | null;
  footerRect: DOMRect | null;
  pageRect: DOMRect;
}

interface AutoFitState {
  scale: number;
  isAutoFitting: boolean;
  showOverflowWarning: boolean;
  overflowWarningMessage: string;
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  targetElement: HTMLElement | null;
}

interface TooltipState {
  isOpen: boolean;
  position: { x: number; y: number };
  content: React.ReactNode;
  targetElement: HTMLElement | null;
}

interface GroupToggleState {
  expandedGroups: Set<string>;
}

const TACTILE = THEME_CONFIG.tactile as TactileConfig;
const MIN_AUTO_FIT_SCALE = 0.95;
const AUTO_FIT_STEP = 0.01;
const MAX_AUTO_FIT_ITERATIONS = 50;
const AUTO_FIT_DEBOUNCE_MS = 16;

const DEFAULT_CONTEXT_MENU_ITEMS: ReadonlyArray<PopupMenuItem> = [
  {
    id: "copy-cell-value",
    label: "Copy Cell Value",
    icon: Copy,
    shortcut: "Ctrl+C",
  },
  {
    id: "copy-full-line",
    label: "Copy Full Line Data",
    icon: Copy,
    shortcut: "Ctrl+Shift+C",
  },
  {
    id: "toggle-hidden-columns",
    label: "Toggle Hidden Column Mode",
    icon: Minimize2,
  },
  {
    id: "freeze-header",
    label: "Freeze Header Layout",
    icon: Maximize2,
  },
] as const;

function generatePageId(pageIndex: number): string {
  return `report-page-${pageIndex}`;
}

function generateGroupId(groupValue: string): string {
  return `group-${groupValue.replace(/[^a-zA-Z0-9]/g, "-")}`;
}

export function ReportWorkspace({
  htmlReportStream,
  reportTitle,
  hint,
  plugins = [],
  onLinkClick,
  className,
  style,
  children,
  ...props
}: ReportWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const scaleContainerRef = useRef<HTMLDivElement>(null);
  const footerWarningRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [autoFitScale, setAutoFitScale] = useState<number>(1);
  const [autoFitState, setAutoFitState] = useState<AutoFitState>({
    scale: 1,
    isAutoFitting: false,
    showOverflowWarning: false,
    overflowWarningMessage: "",
  });
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetElement: null,
  });
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    content: null,
    targetElement: null,
  });
  const [groupToggleState, setGroupToggleState] = useState<GroupToggleState>({
    expandedGroups: new Set<string>(),
  });
  const [mounted, setMounted] = useState(false);

  const autoFitRafRef = useRef<number | null>(null);
  const autoFitIterationRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const clickOutsideHandlerRef = useRef<((event: MouseEvent) => void) | null>(
    null,
  );

  const workspaceContext = useMemo<ReportWorkspaceContext>(
    () => ({
      htmlContent: htmlReportStream,
      zoom,
      currentPage,
      totalPages,
      isDarkMode,
      autoFitScale,
      setZoom,
      setCurrentPage,
      setIsDarkMode,
      triggerAutoFit,
    }),
    [htmlReportStream, zoom, currentPage, totalPages, isDarkMode, autoFitScale],
  );

  const triggerAutoFit = useCallback(() => {
    if (
      autoFitState.isAutoFitting ||
      !pagesContainerRef.current ||
      !scaleContainerRef.current
    ) {
      return;
    }

    setAutoFitState((prev) => ({
      ...prev,
      isAutoFitting: true,
      showOverflowWarning: false,
    }));
    autoFitIterationRef.current = 0;

    const performAutoFit = () => {
      if (!pagesContainerRef.current || !scaleContainerRef.current) {
        setAutoFitState((prev) => ({ ...prev, isAutoFitting: false }));
        return;
      }

      const pages = Array.from(
        pagesContainerRef.current.querySelectorAll<HTMLDivElement>(
          "[data-report-page]",
        ),
      );
      if (pages.length === 0) {
        setAutoFitState((prev) => ({ ...prev, isAutoFitting: false }));
        return;
      }

      let hasOverflow = false;
      let maxScale = 1;

      for (const page of pages) {
        const pageRect = page.getBoundingClientRect();
        const footer = page.querySelector<HTMLElement>("[data-report-footer]");

        if (footer) {
          const footerRect = footer.getBoundingClientRect();
          const pageBottom = pageRect.bottom;

          if (footerRect.bottom > pageBottom + 2) {
            hasOverflow = true;
            const requiredScale = pageBottom / footerRect.bottom;
            maxScale = Math.min(
              maxScale,
              Math.max(requiredScale, MIN_AUTO_FIT_SCALE),
            );
          }
        }

        if (page.scrollHeight > page.clientHeight + 2) {
          hasOverflow = true;
          const requiredScale = page.clientHeight / page.scrollHeight;
          maxScale = Math.min(
            maxScale,
            Math.max(requiredScale, MIN_AUTO_FIT_SCALE),
          );
        }
      }

      const newScale = Math.max(maxScale, MIN_AUTO_FIT_SCALE);
      const clampedScale = Math.min(newScale, 1);

      if (
        hasOverflow &&
        clampedScale < zoom - 0.001 &&
        autoFitIterationRef.current < MAX_AUTO_FIT_ITERATIONS
      ) {
        autoFitIterationRef.current++;
        const nextScale = Math.max(zoom - AUTO_FIT_STEP, clampedScale);
        setZoom(nextScale);
        setAutoFitScale(nextScale);

        autoFitRafRef.current = requestAnimationFrame(() => {
          setTimeout(performAutoFit, AUTO_FIT_DEBOUNCE_MS);
        });
      } else {
        if (hasOverflow && clampedScale <= MIN_AUTO_FIT_SCALE + 0.001) {
          setAutoFitState((prev) => ({
            ...prev,
            isAutoFitting: false,
            showOverflowWarning: true,
            overflowWarningMessage:
              "Footer overflow detected. Content may be clipped at minimum scale.",
            scale: clampedScale,
          }));
        } else {
          setAutoFitState((prev) => ({
            ...prev,
            isAutoFitting: false,
            showOverflowWarning: false,
            scale: clampedScale,
          }));
        }
        setZoom(clampedScale);
        setAutoFitScale(clampedScale);
      }
    };

    performAutoFit();
  }, [autoFitState.isAutoFitting, zoom]);

  useLayoutEffect(() => {
    if (!mounted) return;

    const handleResize = () => {
      if (autoFitScale < 1 && !autoFitState.isAutoFitting) {
        triggerAutoFit();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted, autoFitScale, autoFitState.isAutoFitting, triggerAutoFit]);

  useEffect(() => {
    setMounted(true);

    const container = containerRef.current;
    if (!container) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuState.isOpen &&
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenuState((prev) => ({
          ...prev,
          isOpen: false,
          targetElement: null,
        }));
      }
      if (tooltipState.isOpen) {
        setTooltipState((prev) => ({
          ...prev,
          isOpen: false,
          targetElement: null,
          content: null,
        }));
      }
    };

    clickOutsideHandlerRef.current = handleClickOutside;
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("contextmenu", handleClickOutside, true);

    return () => {
      if (clickOutsideHandlerRef.current) {
        document.removeEventListener(
          "mousedown",
          clickOutsideHandlerRef.current,
          true,
        );
        document.removeEventListener(
          "contextmenu",
          clickOutsideHandlerRef.current,
          true,
        );
      }
      if (autoFitRafRef.current) {
        cancelAnimationFrame(autoFitRafRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [contextMenuState.isOpen, tooltipState.isOpen]);

  useEffect(() => {
    if (!pagesContainerRef.current) return;

    const pages =
      pagesContainerRef.current.querySelectorAll<HTMLDivElement>(
        "[data-report-page]",
      );
    setTotalPages(pages.length);

    const setupPageObservers = () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target.hasAttribute("data-report-page")) {
            if (autoFitScale < 1 && !autoFitState.isAutoFitting) {
              triggerAutoFit();
            }
          }
        }
      });

      pages.forEach((page) => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.observe(page);
        }
      });
    };

    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
    }

    mutationObserverRef.current = new MutationObserver((mutations) => {
      let shouldReobserve = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          shouldReobserve = true;
          break;
        }
      }
      if (shouldReobserve) {
        setupPageObservers();
      }
    });

    mutationObserverRef.current.observe(pagesContainerRef.current, {
      childList: true,
      subtree: true,
    });

    setupPageObservers();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [
    htmlReportStream,
    autoFitScale,
    autoFitState.isAutoFitting,
    triggerAutoFit,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const linkElement = target.closest("[data-link][data-id]");

      if (linkElement) {
        event.preventDefault();
        event.stopPropagation();
        const type = linkElement.getAttribute("data-link") || "";
        const id = linkElement.getAttribute("data-id") || "";
        if (type && id && onLinkClick) {
          onLinkClick(type, id);
        }
      }
    };

    const handleTooltipMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tooltipElement = target.closest("[data-tooltip]");

      if (tooltipElement) {
        const content = tooltipElement.getAttribute("data-tooltip");
        if (content) {
          const rect = tooltipElement.getBoundingClientRect();
          setTooltipState({
            isOpen: true,
            position: { x: rect.left + rect.width / 2, y: rect.top },
            content,
            targetElement: tooltipElement,
          });
        }
      }
    };

    const handleTooltipMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tooltipElement = target.closest("[data-tooltip]");

      if (
        tooltipElement &&
        !tooltipElement.contains(event.relatedTarget as Node)
      ) {
        setTooltipState((prev) => ({
          ...prev,
          isOpen: false,
          targetElement: null,
          content: null,
        }));
      }
    };

    const handleGroupToggle = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const groupTrigger = target.closest("[data-group-trigger]");

      if (groupTrigger) {
        event.preventDefault();
        event.stopPropagation();
        const groupValue = groupTrigger.getAttribute("data-group-trigger");
        if (groupValue) {
          const groupId = generateGroupId(groupValue);
          setGroupToggleState((prev) => {
            const newExpanded = new Set(prev.expandedGroups);
            if (newExpanded.has(groupId)) {
              newExpanded.delete(groupId);
            } else {
              newExpanded.add(groupId);
            }
            return { expandedGroups: newExpanded };
          });
        }
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const reportArea = target.closest("[data-report-workspace]");

      if (
        reportArea &&
        (event.target === reportArea || reportArea.contains(target))
      ) {
        event.preventDefault();
        event.stopPropagation();
        setContextMenuState({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          targetElement: target,
        });
      }
    };

    containerRef.current.addEventListener("click", handleLinkClick, true);
    containerRef.current.addEventListener(
      "mouseenter",
      handleTooltipMouseEnter,
      true,
    );
    containerRef.current.addEventListener(
      "mouseleave",
      handleTooltipMouseLeave,
      true,
    );
    containerRef.current.addEventListener("click", handleGroupToggle, true);
    containerRef.current.addEventListener("contextmenu", handleContextMenu);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener(
          "click",
          handleLinkClick,
          true,
        );
        containerRef.current.removeEventListener(
          "mouseenter",
          handleTooltipMouseEnter,
          true,
        );
        containerRef.current.removeEventListener(
          "mouseleave",
          handleTooltipMouseLeave,
          true,
        );
        containerRef.current.removeEventListener(
          "click",
          handleGroupToggle,
          true,
        );
        containerRef.current.removeEventListener(
          "contextmenu",
          handleContextMenu,
        );
      }
    };
  }, [onLinkClick]);

  const handleGroupRowVisibility = useCallback(
    (groupValue: string, isExpanded: boolean) => {
      if (!pagesContainerRef.current) return;

      const groupRows = pagesContainerRef.current.querySelectorAll<HTMLElement>(
        `[data-group="${groupValue}"]`,
      );
      groupRows.forEach((row) => {
        row.style.display = isExpanded ? "" : "none";
      });
    },
    [],
  );

  useEffect(() => {
    groupToggleState.expandedGroups.forEach((groupId) => {
      const groupValue = groupId.replace("group-", "").replace(/-/g, " ");
      handleGroupRowVisibility(groupValue, true);
    });

    const allGroupValues = new Set<string>();
    if (pagesContainerRef.current) {
      pagesContainerRef.current
        .querySelectorAll("[data-group-trigger]")
        .forEach((el) => {
          const val = el.getAttribute("data-group-trigger");
          if (val) allGroupValues.add(val);
        });
    }

    allGroupValues.forEach((groupValue) => {
      const groupId = generateGroupId(groupValue);
      if (!groupToggleState.expandedGroups.has(groupId)) {
        handleGroupRowVisibility(groupValue, false);
      }
    });
  }, [groupToggleState.expandedGroups, handleGroupRowVisibility]);

  const buildContextMenuItems = useCallback((): PopupMenuConfig => {
    const pluginActions: PopupMenuItem[] = [];

    plugins.forEach((plugin) => {
      if (plugin.renderContextMenuItems) {
        const pluginItems = plugin.renderContextMenuItems(
          workspaceContext,
          contextMenuState.targetElement!,
        );
        if (pluginItems) {
          const itemsArray = React.Children.toArray(pluginItems);
          itemsArray.forEach((item, index) => {
            if (React.isValidElement(item)) {
              pluginActions.push({
                id: `plugin-${plugin.id}-${index}`,
                label:
                  item.props.children?.toString() ||
                  `Plugin Action ${index + 1}`,
                icon: item.props.icon,
                onClick: item.props.onClick,
              });
            }
          });
        }
      }
    });

    const defaultItems: PopupMenuItem[] = DEFAULT_CONTEXT_MENU_ITEMS.map(
      (item) => ({
        ...item,
        onClick: () => {
          switch (item.id) {
            case "copy-cell-value":
              if (contextMenuState.targetElement) {
                const cellText =
                  contextMenuState.targetElement.textContent?.trim() || "";
                navigator.clipboard.writeText(cellText);
              }
              break;
            case "copy-full-line":
              if (contextMenuState.targetElement) {
                const row = contextMenuState.targetElement.closest(
                  "tr, [data-report-row]",
                );
                const lineText = row?.textContent?.trim() || "";
                navigator.clipboard.writeText(lineText);
              }
              break;
            case "toggle-hidden-columns":
              if (pagesContainerRef.current) {
                const hiddenColumns =
                  pagesContainerRef.current.querySelectorAll(
                    "[data-hidden-column]",
                  );
                hiddenColumns.forEach((col) => {
                  const isHidden =
                    col.getAttribute("data-hidden-column") === "true";
                  col.setAttribute(
                    "data-hidden-column",
                    (!isHidden).toString(),
                  );
                  (col as HTMLElement).style.display = isHidden ? "" : "none";
                });
              }
              break;
            case "freeze-header":
              if (pagesContainerRef.current) {
                const headers = pagesContainerRef.current.querySelectorAll(
                  "[data-report-header]",
                );
                headers.forEach((header) => {
                  const isFrozen =
                    header.getAttribute("data-frozen") === "true";
                  header.setAttribute("data-frozen", (!isFrozen).toString());
                  (header as HTMLElement).style.position = isFrozen
                    ? ""
                    : "sticky";
                  (header as HTMLElement).style.top = isFrozen ? "" : "0";
                  (header as HTMLElement).style.zIndex = isFrozen ? "" : "10";
                });
              }
              break;
          }
          setContextMenuState((prev) => ({ ...prev, isOpen: false }));
        },
      }),
    );

    return {
      items: [...defaultItems, ...pluginActions],
      trigger: null,
      triggerType: "context-menu",
    };
  }, [plugins, workspaceContext, contextMenuState.targetElement]);

  const renderToolbarActions = useCallback(() => {
    const actions: React.ReactNode[] = [];

    plugins.forEach((plugin) => {
      if (plugin.renderToolbarAction) {
        const action = plugin.renderToolbarAction(workspaceContext);
        if (action) {
          actions.push(action);
        }
      }
    });

    return actions;
  }, [plugins, workspaceContext]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.25));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setAutoFitScale(1);
  }, []);

  const handlePageChange = useCallback(
    (delta: number) => {
      setCurrentPage((prev) => Math.max(1, Math.min(totalPages, prev + delta)));
    },
    [totalPages],
  );

  const handleDarkModeToggle = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const handleAutoFitClick = useCallback(() => {
    triggerAutoFit();
  }, [triggerAutoFit]);

  const handleKeepOriginalClick = useCallback(() => {
    setAutoFitState((prev) => ({ ...prev, showOverflowWarning: false }));
    setZoom(1);
    setAutoFitScale(1);
  }, []);

  const transformStyle = useMemo(
    () => ({
      transform: `scale(${zoom})`,
      transformOrigin: "top center",
      width: `${100 / zoom}%`,
    }),
    [zoom],
  );

  const containerStyle = useMemo(
    () => ({
      ...style,
      width: "100%",
      overflow: "auto",
      position: "relative" as const,
    }),
    [style],
  );

  const pageElements = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlReportStream, "text/html");
    const bodyContent = doc.body.innerHTML;

    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = bodyContent;

    const pages = tempContainer.querySelectorAll("[data-report-page]");
    if (pages.length === 0) {
      const singlePage = document.createElement("div");
      singlePage.setAttribute("data-report-page", "1");
      singlePage.innerHTML = bodyContent;
      return [singlePage];
    }

    return Array.from(pages).map((page, index) => {
      const pageDiv = document.createElement("div");
      pageDiv.setAttribute("data-report-page", String(index + 1));
      pageDiv.innerHTML = page.innerHTML;
      return pageDiv;
    });
  }, [htmlReportStream]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col min-h-0 bg-background",
        "data-[dark-mode=true]:bg-background data-[dark-mode=true]:text-foreground",
        className,
      )}
      style={containerStyle}
      data-report-workspace=""
      data-dark-mode={isDarkMode}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 p-3 border-b border-[color-mix(in_oklch,var(--color-border)_40%,transparent)]",
          "bg-card/50 backdrop-blur-sm",
          TACTILE.flex,
          TACTILE.itemsCenter,
          TACTILE.justifyBetween,
          TACTILE.gap3,
          TACTILE.p3,
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            TACTILE.flex,
            TACTILE.itemsCenter,
            TACTILE.gap2,
          )}
        >
          <h1
            className={cn(
              "font-semibold text-text-main truncate max-w-[300px]",
              TACTILE.textLg,
              TACTILE.fontSemibold,
              TACTILE.textForeground,
              TACTILE.truncate,
              TACTILE.maxW300px,
            )}
          >
            {reportTitle}
          </h1>
          {hint && (
            <HintBox content={hint} position="top">
              <span className="text-sm text-text-muted" />
            </HintBox>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2",
            TACTILE.flex,
            TACTILE.itemsCenter,
            TACTILE.gap2,
          )}
        >
          {renderToolbarActions()}

          <div
            className={cn(
              "flex items-center gap-1 border border-[color-mix(in_oklch,var(--color-border)_40%,transparent)] rounded-surface overflow-hidden",
              TACTILE.border,
              TACTILE.roundedSurface,
              TACTILE.flex,
              TACTILE.itemsCenter,
              TACTILE.gap1,
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              className={TACTILE.activeScale95}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <span
              className={cn(
                "px-2 text-sm font-mono text-text-main min-w-[48px] text-center",
                TACTILE.textSm,
                TACTILE.fontMono,
                TACTILE.textForeground,
                TACTILE.px2,
              )}
            >
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              className={TACTILE.activeScale95}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomReset}
              aria-label="Reset zoom"
              className={TACTILE.activeScale95}
            >
              <span className="text-xs font-medium">100%</span>
            </Button>
          </div>

          <div
            className={cn(
              "flex items-center gap-1",
              TACTILE.flex,
              TACTILE.itemsCenter,
              TACTILE.gap1,
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(-1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className={TACTILE.activeScale95}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span
              className={cn(
                "px-2 text-sm font-mono text-text-main min-w-[60px] text-center",
                TACTILE.textSm,
                TACTILE.fontMono,
                TACTILE.textForeground,
                TACTILE.px2,
              )}
            >
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              className={TACTILE.activeScale95}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDarkModeToggle}
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            className={TACTILE.activeScale95}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAutoFitClick}
            aria-label="Auto-fit content"
            className={TACTILE.activeScale95}
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Auto Fit</span>
          </Button>
        </div>
      </div>

      <div
        ref={pagesContainerRef}
        className={cn(
          "flex-1 overflow-auto relative",
          "data-[dark-mode=true]:bg-background",
          TACTILE.flex1,
          TACTILE.overflowAuto,
          TACTILE.relative,
        )}
        style={{ width: "100%", height: "100%" }}
        data-dark-mode={isDarkMode}
      >
        <div
          ref={scaleContainerRef}
          className={cn("relative", TACTILE.relative)}
          style={transformStyle}
        >
          {pageElements.map((pageElement, index) => (
            <div
              key={index}
              className={cn(
                "relative mx-auto my-4 bg-white shadow-lg",
                "data-[dark-mode=true]:bg-card data-[dark-mode=true]:shadow-[var(--shadow-xl)]",
                "min-h-[297mm] w-[210mm]",
                "print:page-break-after-always print:shadow-none print:my-0",
                TACTILE.mxAuto,
                TACTILE.my4,
                TACTILE.shadowXl,
              )}
              style={{
                width: "210mm",
                minHeight: "297mm",
                boxSizing: "border-box",
              }}
              data-report-page={index + 1}
              data-dark-mode={isDarkMode}
            >
              {pageElement}
            </div>
          ))}
        </div>
      </div>

      {autoFitState.showOverflowWarning && (
        <div
          ref={footerWarningRef}
          className={cn(
            "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
            "bg-destructive/95 text-destructive-foreground",
            "border border-destructive/50 rounded-surface",
            "shadow-xl px-4 py-3 flex items-center gap-3",
            "animate-in slide-in-from-bottom-4 fade-in duration-200",
            "max-w-[90vw]",
            TACTILE.fixed,
            TACTILE.bottom4,
            TACTILE.left1_2,
            TACTILE.translateXFullNegative,
            TACTILE.z50,
            TACTILE.roundedSurface,
            TACTILE.shadowXl,
            TACTILE.px4,
            TACTILE.py3,
            TACTILE.flex,
            TACTILE.itemsCenter,
            TACTILE.gap3,
          )}
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-destructive-foreground" />
          <span className="text-sm font-medium flex-1">
            {autoFitState.overflowWarningMessage}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleAutoFitClick}
            className={TACTILE.activeScale95}
          >
            Auto Fit View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleKeepOriginalClick}
            className={TACTILE.activeScale95}
          >
            Keep Original
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setAutoFitState((prev) => ({
                ...prev,
                showOverflowWarning: false,
              }))
            }
            aria-label="Dismiss warning"
            className={TACTILE.activeScale95}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {tooltipState.isOpen && tooltipState.content && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 pointer-events-none",
            "bg-card backdrop-blur-[var(--backdrop-blur)]",
            "border border-[color-mix(in_oklch,var(--color-border)_50%,transparent)]",
            "rounded-surface shadow-lg px-3 py-2",
            "max-w-xs text-sm text-card-foreground font-sans",
            "animate-in fade-in-0 duration-150",
            TACTILE.fixed,
            TACTILE.z50,
            TACTILE.roundedSurface,
            TACTILE.shadowXl,
            TACTILE.px3,
            TACTILE.py2,
            TACTILE.textSm,
            TACTILE.maxW300px,
          )}
          style={{
            left: tooltipState.position.x,
            top: tooltipState.position.y,
            transform: "translateX(-50%) translateY(-100%)",
          }}
          role="tooltip"
        >
          {tooltipState.content}
        </div>
      )}

      {contextMenuState.isOpen && (
        <PopupMenu ref={contextMenuRef} {...buildContextMenuItems()} />
      )}

      {children}
    </div>
  );
}

import { Sun, Moon, ChevronLeft } from "lucide-react";

ReportWorkspace.displayName = "ReportWorkspace";

export default ReportWorkspace;
