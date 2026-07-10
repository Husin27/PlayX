/**
 * Context Menu Engine - Handles context menu pipeline building.
 * Strictly typed, zero `any` usage.
 * Uses ActionRegistry for dynamic pipeline merger.
 */

import type { ReportWorkspacePlugin } from "../types/plugin-types";
import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
  PluginExecutionContext,
} from "../types/plugin-types";
import {
  ActionRegistry,
  type RegisteredAction,
} from "../services/action-registry";

export interface ContextMenuAction {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
}

export interface ContextMenuPipeline {
  [key: string]: () => void;
}

export interface ContextMenuEngineOptions {
  uiCtx: ReportWorkspaceUIContext;
  mutCtx: ReportWorkspaceMutableContext;
  plugins: ReportWorkspacePlugin[];
  coreRegistry: ActionRegistry;
}

export class ContextMenuEngine {
  private readonly options: ContextMenuEngineOptions;
  private readonly mergedRegistry: ActionRegistry;

  constructor(options: ContextMenuEngineOptions) {
    this.options = options;
    this.mergedRegistry = this.buildMergedRegistry();
  }

  /**
   * Builds merged registry from core and plugin actions.
   * This is the single dynamic pipeline merger for context menu.
   */
  private buildMergedRegistry(): ActionRegistry {
    const pluginRegistries = this.options.plugins
      .filter((p) => p.renderContextMenuItems)
      .map((plugin) => {
        const registry = new ActionRegistry();
        const executionContext = this.createExecutionContext(plugin);

        // Plugin contributes actions via renderContextMenuItems
        // The plugin returns React nodes, but we also allow direct action registration
        plugin.renderContextMenuItems?.(
          this.options.uiCtx,
          document.body, // placeholder target
          executionContext,
        );

        // If plugin provides action configs directly, register them
        // For now, we rely on the registry merger pattern

        return registry;
      });

    return ActionRegistry.merge(this.options.coreRegistry, ...pluginRegistries);
  }

  /**
   * Creates execution context for a plugin.
   */
  private createExecutionContext(
    plugin: ReportWorkspacePlugin,
  ): PluginExecutionContext {
    return {
      pluginId: plugin.id,
      pluginName: plugin.name,
      uiContext: this.options.uiCtx,
      mutableContext: this.options.mutCtx,
      initializedAt: Date.now(),
      metadata: new Map(),
    };
  }

  /**
   * Builds context menu pipeline from merged registry.
   * @param target - Target element that triggered the context menu
   * @returns Pipeline of action handlers keyed by action ID
   */
  public buildPipeline(target: HTMLElement): ContextMenuPipeline {
    const pipeline: ContextMenuPipeline = {};

    // Get context menu actions from merged registry
    const actions = this.mergedRegistry.getContextMenuActions(
      this.options.uiCtx,
      target,
    );

    for (const action of actions) {
      pipeline[action.id] = () =>
        action.action(this.options.uiCtx, this.options.mutCtx);
    }

    // Add plugin-specific context menu items (React nodes)
    for (const plugin of this.options.plugins) {
      if (plugin.renderContextMenuItems) {
        const executionContext = this.createExecutionContext(plugin);
        const items = plugin.renderContextMenuItems(
          this.options.uiCtx,
          target,
          executionContext,
        );
        if (items) {
          // Plugin returns React nodes for custom rendering
          // Action extraction would happen here if needed
        }
      }
    }

    return pipeline;
  }

  /**
   * Extracts action handlers from React context menu items.
   * @param items - React nodes from plugin
   * @returns Action handlers keyed by action ID
   */
  private extractActions(items: React.ReactNode): ContextMenuPipeline {
    const actions: ContextMenuPipeline = {};

    // This is a simplified extraction - in practice you'd traverse
    // the React element tree to find action handlers
    // For now, return empty pipeline as placeholder
    return actions;
  }

  /**
   * Shows context menu at specified position.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param pipeline - Action pipeline
   */
  public show(x: number, y: number, pipeline: ContextMenuPipeline): void {
    console.log(
      "Showing context menu at",
      x,
      y,
      "with actions:",
      Object.keys(pipeline),
    );
  }

  /**
   * Hides the context menu.
   */
  public hide(): void {
    // Context menu hide logic would go here
  }

  /**
   * Get the merged action registry for external access.
   */
  public getRegistry(): ActionRegistry {
    return this.mergedRegistry;
  }

  /**
   * Get context menu actions as RegisteredAction array for custom rendering.
   */
  public getContextMenuActions(): readonly RegisteredAction[] {
    return this.mergedRegistry.getContextMenuActions(
      this.options.uiCtx,
      document.body,
    );
  }
}
