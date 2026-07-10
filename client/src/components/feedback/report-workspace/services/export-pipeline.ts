/**
 * Export Pipeline - Abstract strategy pipeline for export operations.
 * Clean boilerplate-free vanilla TypeScript core service class.
 * Ready for future plugin integration.
 */

import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "../types/plugin-types";

/**
 * Supported export formats.
 */
export type ExportFormat = "HTML" | "PDF" | "EXCEL" | "IMAGE";

/**
 * Export configuration options.
 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeStyles?: boolean;
  pageRange?: { start: number; end: number };
  quality?: number; // For IMAGE format
  metadata?: Record<string, unknown>;
}

/**
 * Export result.
 */
export interface ExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: Error;
  format: ExportFormat;
  timestamp: number;
}

/**
 * Export handler function signature.
 */
export type ExportHandler = (
  uiCtx: ReportWorkspaceUIContext,
  mutCtx: ReportWorkspaceMutableContext,
  options: ExportOptions,
) => Promise<ExportResult>;

/**
 * Export pipeline stage.
 */
export interface ExportStage {
  name: string;
  execute: (
    result: ExportResult,
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
    options: ExportOptions,
  ) => Promise<ExportResult>;
}

/**
 * Export Pipeline - Abstract strategy pipeline for export operations.
 * Exposes hook entry points for format-specific exporters.
 */
export class ExportPipeline {
  private exporters: Map<ExportFormat, ExportHandler> = new Map();
  private stages: ExportStage[] = [];
  private uiCtx: ReportWorkspaceUIContext | null = null;
  private mutCtx: ReportWorkspaceMutableContext | null = null;

  /**
   * Set the UI and mutable contexts for export operations.
   * @param uiCtx - UI context
   * @param mutCtx - Mutable context
   */
  public setContexts(
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
  ): void {
    this.uiCtx = uiCtx;
    this.mutCtx = mutCtx;
  }

  /**
   * Register an exporter for a specific format.
   * @param format - Export format
   * @param handler - Export handler function
   */
  public registerExporter(format: ExportFormat, handler: ExportHandler): void {
    this.exporters.set(format, handler);
  }

  /**
   * Unregister an exporter.
   * @param format - Export format
   */
  public unregisterExporter(format: ExportFormat): void {
    this.exporters.delete(format);
  }

  /**
   * Check if an exporter is registered for a format.
   * @param format - Export format
   * @returns True if exporter exists
   */
  public hasExporter(format: ExportFormat): boolean {
    return this.exporters.has(format);
  }

  /**
   * Get registered exporter for a format.
   * @param format - Export format
   * @returns Export handler or undefined
   */
  public getExporter(format: ExportFormat): ExportHandler | undefined {
    return this.exporters.get(format);
  }

  /**
   * Get all registered export formats.
   * @returns Array of registered formats
   */
  public getRegisteredFormats(): readonly ExportFormat[] {
    return Array.from(this.exporters.keys());
  }

  /**
   * Add a pipeline stage.
   * @param stage - Pipeline stage
   */
  public addStage(stage: ExportStage): void {
    this.stages.push(stage);
  }

  /**
   * Remove a pipeline stage by name.
   * @param name - Stage name
   */
  public removeStage(name: string): void {
    this.stages = this.stages.filter((s) => s.name !== name);
  }

  /**
   * Execute export with the registered exporter for the format.
   * @param options - Export options
   * @returns Export result
   */
  public async export(options: ExportOptions): Promise<ExportResult> {
    if (!this.uiCtx || !this.mutCtx) {
      return {
        success: false,
        error: new Error("Export contexts not initialized"),
        format: options.format,
        timestamp: Date.now(),
      };
    }

    const exporter = this.exporters.get(options.format);
    if (!exporter) {
      return {
        success: false,
        error: new Error(
          `No exporter registered for format: ${options.format}`,
        ),
        format: options.format,
        timestamp: Date.now(),
      };
    }

    // Execute the exporter
    let result = await exporter(this.uiCtx, this.mutCtx, options);

    // Run pipeline stages
    for (const stage of this.stages) {
      try {
        result = await stage.execute(result, this.uiCtx, this.mutCtx, options);
      } catch (error) {
        console.error(`Export pipeline stage "${stage.name}" failed:`, error);
        result = {
          ...result,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
        break;
      }
    }

    return result;
  }

  /**
   * Create a default export pipeline with common stages.
   * @returns Configured ExportPipeline instance
   */
  public static createDefault(): ExportPipeline {
    const pipeline = new ExportPipeline();

    // Add default stages
    pipeline.addStage({
      name: "validate",
      execute: async (result) => {
        if (!result.success) return result;
        if (!result.blob && !result.url) {
          return {
            ...result,
            success: false,
            error: new Error("Export produced no output"),
          };
        }
        return result;
      },
    });

    pipeline.addStage({
      name: "finalize",
      execute: async (result) => {
        // Final processing (e.g., revoke object URLs after delay)
        if (result.url && result.url.startsWith("blob:")) {
          setTimeout(() => URL.revokeObjectURL(result.url!), 60000);
        }
        return result;
      },
    });

    return pipeline;
  }
}

/**
 * Export Pipeline Factory - Creates configured export pipeline instances.
 */
export class ExportPipelineFactory {
  /**
   * Create a new export pipeline instance.
   * @param uiCtx - UI context (optional)
   * @param mutCtx - Mutable context (optional)
   * @returns New ExportPipeline instance
   */
  public static create(
    uiCtx?: ReportWorkspaceUIContext,
    mutCtx?: ReportWorkspaceMutableContext,
  ): ExportPipeline {
    const pipeline = ExportPipeline.createDefault();
    if (uiCtx && mutCtx) {
      pipeline.setContexts(uiCtx, mutCtx);
    }
    return pipeline;
  }
}

/**
 * Built-in export handlers (to be implemented by consumers).
 * These are placeholder signatures for the core export formats.
 */
export const BuiltInExporters = {
  /**
   * HTML export handler signature.
   * Implementation should serialize the report to HTML.
   */
  HTML: async (
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
    options: ExportOptions,
  ): Promise<ExportResult> => {
    // Placeholder - implementation provided by consumer
    return {
      success: false,
      error: new Error("HTML exporter not implemented"),
      format: "HTML",
      timestamp: Date.now(),
    };
  },

  /**
   * PDF export handler signature.
   * Implementation should generate PDF from report content.
   */
  PDF: async (
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
    options: ExportOptions,
  ): Promise<ExportResult> => {
    // Placeholder - implementation provided by consumer
    return {
      success: false,
      error: new Error("PDF exporter not implemented"),
      format: "PDF",
      timestamp: Date.now(),
    };
  },

  /**
   * Excel export handler signature.
   * Implementation should export report data to Excel format.
   */
  EXCEL: async (
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
    options: ExportOptions,
  ): Promise<ExportResult> => {
    // Placeholder - implementation provided by consumer
    return {
      success: false,
      error: new Error("Excel exporter not implemented"),
      format: "EXCEL",
      timestamp: Date.now(),
    };
  },

  /**
   * Image export handler signature.
   * Implementation should render report to image (PNG/JPEG).
   */
  IMAGE: async (
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
    options: ExportOptions,
  ): Promise<ExportResult> => {
    // Placeholder - implementation provided by consumer
    return {
      success: false,
      error: new Error("Image exporter not implemented"),
      format: "IMAGE",
      timestamp: Date.now(),
    };
  },
};
