/**
 * Report Workspace - Public API Exports
 *
 * Consolidated entry point for PUBLIC API ONLY.
 * All internal engines, services, and engines are INTERNALIZED and hidden from external discovery.
 * Zero "any" usage. Strict discriminated unions. Clean plugin architecture.
 */

// ============================================================================
// PUBLIC API - Core Types & Plugin System
// ============================================================================

export type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
  PluginExecutionContext,
  ReportWorkspacePlugin,
} from "./types/plugin-types";

// ============================================================================
// PUBLIC API - Workspace Component & Props
// ============================================================================

export { ReportWorkspace } from "./report-workspace";

export type { ReportWorkspaceProps } from "./types/workspace-types";

// ============================================================================
// INTERNAL - NOT EXPORTED (Internalized)
// ============================================================================
// The following are INTERNALIZED and NOT exported publicly:
// - ActionRegistry, ActionRegistry types
// - SelectionService, NavigationService, SearchService
// - ExportPipeline, PreferencesService
// - All Engines: ReportEngine, RenderEngine, AutoFitEngine, HyperlinkEngine,
//   GroupEngine, DOMEngine, TooltipEngine, ContextMenuEngine
// - Context Providers: UIContext, MutableContext, EngineContext
// - Components: ReportToolbar, ReportCanvas, ReportWarningBar
// - All Report Types from report-types.ts
// - All Workspace Types from workspace-types.ts
// - All Service Types from services/
// - All Engine Types from engines/
// ============================================================================
