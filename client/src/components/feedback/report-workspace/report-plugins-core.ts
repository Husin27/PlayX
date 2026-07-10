import React from "react";
import type { ReportWorkspaceState } from "./report-types";
import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "./types/plugin-types";

/**
 * Plugin Infrastructure Core for Report Workspace.
 * Clean decoupled plugin system with strict typing.
 * Zero "any" usage. Strict discriminated unions.
 */

export interface ReportWorkspacePlugin {
  id: string;
  name: string;
  onInit?: (
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
  ) => void;
  onMounted?: (
    container: HTMLDivElement,
    uiCtx: ReportWorkspaceUIContext,
  ) => void;
  onUnmounted?: (container: HTMLDivElement) => void;
  onDOMRender?: (
    container: HTMLDivElement,
    uiCtx: ReportWorkspaceUIContext,
  ) => void;
  renderToolbarAction?: (
    context: ReportWorkspaceUIContext & ReportWorkspaceMutableContext,
  ) => React.ReactNode;
  renderContextMenuItems?: (
    uiCtx: ReportWorkspaceUIContext,
    targetElement: HTMLElement,
  ) => React.ReactNode;
}
