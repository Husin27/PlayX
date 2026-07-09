import React from "react";
import type { ReportWorkspaceState } from "./report-types";

/**
 * Plugin Infrastructure Core for Report Workspace.
 * Clean decoupled plugin system with strict typing.
 * Zero "any" usage. Strict discriminated unions.
 */

export interface ReportWorkspaceContext extends ReportWorkspaceState {
  htmlContent: string;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  triggerAutoFit: () => void;
}

export interface ReportWorkspacePlugin {
  id: string;
  name: string;
  onInit?: (context: ReportWorkspaceContext) => void;
  onDOMRender?: (
    container: HTMLDivElement,
    context: ReportWorkspaceContext,
  ) => void;
  renderToolbarAction?: (context: ReportWorkspaceContext) => React.ReactNode;
  renderContextMenuItems?: (
    context: ReportWorkspaceContext,
    targetElement: HTMLElement,
  ) => React.ReactNode;
}
