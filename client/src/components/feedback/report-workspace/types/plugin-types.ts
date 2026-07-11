import type { ReportWorkspaceState } from "../report-types";

export interface ReportWorkspaceUIContext extends ReportWorkspaceState {
  htmlContent: string;
}

export interface ReportWorkspaceMutableContext {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setTotalPages: React.Dispatch<React.SetStateAction<number>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoFitScale: React.Dispatch<React.SetStateAction<number>>;
  setShowWarningBanner: React.Dispatch<React.SetStateAction<boolean>>;
  triggerAutoFit: () => void;
}

/**
 * Execution context helper for plugin lifecycle management.
 * Provides structured access to workspace internals without exposing internals.
 */
export interface PluginExecutionContext {
  /** Unique plugin identifier */
  pluginId: string;
  /** Plugin display name */
  pluginName: string;
  /** Current workspace UI context snapshot */
  uiContext: Readonly<ReportWorkspaceUIContext>;
  /** Mutable workspace context for state mutations */
  mutableContext: ReportWorkspaceMutableContext;
  /** Timestamp when plugin was initialized */
  initializedAt: number;
  /** Timestamp when plugin was mounted (if mounted) */
  mountedAt?: number;
  /** Plugin-specific metadata storage */
  metadata: Map<string, unknown>;
}

/**
 * Extended plugin interface with advanced lifecycle callbacks
 * and execution context support.
 */
export interface ReportWorkspacePlugin {
  id: string;
  name: string;
  /** Called once during plugin initialization with UI and mutable contexts */
  onInit?: (
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
  ) => void;
  /** Called when plugin is mounted to DOM container */
  onMounted?: (
    container: HTMLDivElement,
    uiCtx: ReportWorkspaceUIContext,
    executionContext: PluginExecutionContext,
  ) => void;
  /** Called when plugin is unmounted from DOM container */
  onUnmounted?: (
    container: HTMLDivElement,
    executionContext: PluginExecutionContext,
  ) => void;
  /** Called on each DOM render cycle */
  onDOMRender?: (
    container: HTMLDivElement,
    uiCtx: ReportWorkspaceUIContext,
    executionContext: PluginExecutionContext,
  ) => void;
  /** Called when plugin is about to be destroyed */
  onDestroy?: (executionContext: PluginExecutionContext) => void;
  /** Render custom toolbar action */
  renderToolbarAction?: (
    context: ReportWorkspaceUIContext & ReportWorkspaceMutableContext,
  ) => React.ReactNode;
  /** Render custom context menu items */
  renderContextMenuItems?: (
    uiCtx: ReportWorkspaceUIContext,
    targetElement: HTMLElement,
    executionContext: PluginExecutionContext,
  ) => React.ReactNode;
  /** Optional: Plugin-specific configuration schema */
  configSchema?: Record<string, unknown>;
  /** Optional: Plugin version for compatibility checking */
  version?: string;
  /** Optional: Plugin dependencies (other plugin IDs) */
  dependencies?: string[];
}
