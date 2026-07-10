import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "../types/plugin-types";

/**
 * Action configuration for registry registration.
 * Immutable registration mechanism for toolbar and context menu actions.
 */
export interface ActionConfig {
  /** Unique action identifier */
  id: string;
  /** Action group for organization (e.g., "edit", "view", "export", "plugin") */
  group: string;
  /** Human-readable label for UI display */
  label: string;
  /** Display order within group (lower = first) */
  order: number;
  /** Optional icon (emoji, SVG, or component) */
  icon?: string | React.ReactNode;
  /** Action handler - receives UI and mutable contexts */
  action: (
    ui: ReportWorkspaceUIContext,
    mut: ReportWorkspaceMutableContext,
  ) => void;
  /** Optional: whether action is enabled */
  enabled?: boolean | ((ui: ReportWorkspaceUIContext) => boolean);
  /** Optional: whether action is visible */
  visible?: boolean | ((ui: ReportWorkspaceUIContext) => boolean);
  /** Optional: keyboard shortcut hint */
  shortcut?: string;
  /** Optional: action variant for styling */
  variant?: "default" | "primary" | "secondary" | "danger" | "ghost";
}

/**
 * Registered action with metadata.
 * Immutable once registered.
 */
export interface RegisteredAction extends ActionConfig {
  /** Registration timestamp */
  registeredAt: number;
  /** Source plugin ID (if from plugin) */
  sourcePluginId?: string;
  /** Whether this is a built-in core action */
  isCore: boolean;
}

/**
 * Action group configuration for UI organization.
 */
export interface ActionGroup {
  /** Group identifier */
  id: string;
  /** Group display label */
  label: string;
  /** Group display order */
  order: number;
  /** Optional group icon */
  icon?: string;
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * Immutable Action Registry Service.
 * Provides centralized action registration and retrieval for toolbar and context menu.
 * Zero mutation after registration - returns new registry instances.
 */
export class ActionRegistry {
  private actions: Map<string, RegisteredAction> = new Map();
  private groups: Map<string, ActionGroup> = new Map();
  private pluginActions: Map<string, Set<string>> = new Map();

  /**
   * Register a core (built-in) action.
   * @param config - Action configuration
   * @returns New ActionRegistry instance with action registered
   */
  public registerCoreAction(config: ActionConfig): ActionRegistry {
    const newRegistry = this.clone();
    const registeredAction: RegisteredAction = {
      ...config,
      registeredAt: Date.now(),
      isCore: true,
    };
    newRegistry.actions.set(config.id, registeredAction);
    newRegistry.ensureGroup(config.group);
    return newRegistry;
  }

  /**
   * Register a plugin-contributed action.
   * @param pluginId - Source plugin identifier
   * @param config - Action configuration
   * @returns New ActionRegistry instance with action registered
   */
  public registerPluginAction(
    pluginId: string,
    config: ActionConfig,
  ): ActionRegistry {
    const newRegistry = this.clone();
    const registeredAction: RegisteredAction = {
      ...config,
      registeredAt: Date.now(),
      sourcePluginId: pluginId,
      isCore: false,
    };
    newRegistry.actions.set(config.id, registeredAction);
    newRegistry.ensureGroup(config.group);

    // Track plugin actions for cleanup
    if (!newRegistry.pluginActions.has(pluginId)) {
      newRegistry.pluginActions.set(pluginId, new Set());
    }
    newRegistry.pluginActions.get(pluginId)!.add(config.id);

    return newRegistry;
  }

  /**
   * Register multiple actions at once (bulk registration).
   * @param actions - Array of action configurations
   * @param pluginId - Optional plugin ID for plugin actions
   * @returns New ActionRegistry instance
   */
  public registerActions(
    actions: ActionConfig[],
    pluginId?: string,
  ): ActionRegistry {
    let registry: ActionRegistry = this.clone();
    for (const action of actions) {
      registry = pluginId
        ? registry.registerPluginAction(pluginId, action)
        : registry.registerCoreAction(action);
    }
    return registry;
  }

  /**
   * Unregister all actions from a specific plugin.
   * @param pluginId - Plugin identifier
   * @returns New ActionRegistry instance with plugin actions removed
   */
  public unregisterPluginActions(pluginId: string): ActionRegistry {
    const newRegistry = this.clone();
    const actionIds = newRegistry.pluginActions.get(pluginId);
    if (actionIds) {
      for (const id of actionIds) {
        newRegistry.actions.delete(id);
      }
      newRegistry.pluginActions.delete(pluginId);
    }
    return newRegistry;
  }

  /**
   * Get a registered action by ID.
   * @param id - Action identifier
   * @returns Registered action or undefined
   */
  public getAction(id: string): RegisteredAction | undefined {
    return this.actions.get(id);
  }

  /**
   * Get all registered actions as immutable array.
   * @returns Array of all registered actions sorted by group and order
   */
  public getAllActions(): readonly RegisteredAction[] {
    return Array.from(this.actions.values()).sort((a, b) => {
      const groupA = this.groups.get(a.group);
      const groupB = this.groups.get(b.group);
      const groupOrderA = groupA?.order ?? 999;
      const groupOrderB = groupB?.order ?? 999;
      if (groupOrderA !== groupOrderB) return groupOrderA - groupOrderB;
      return a.order - b.order;
    });
  }

  /**
   * Get actions filtered by group.
   * @param groupId - Group identifier
   * @returns Actions in the specified group
   */
  public getActionsByGroup(groupId: string): readonly RegisteredAction[] {
    return this.getAllActions().filter((a) => a.group === groupId);
  }

  /**
   * Get actions for toolbar (filtered by visibility and enabled state).
   * @param uiCtx - Current UI context for visibility/enabled evaluation
   * @returns Actions suitable for toolbar rendering
   */
  public getToolbarActions(
    uiCtx: ReportWorkspaceUIContext,
  ): readonly RegisteredAction[] {
    return this.getAllActions().filter((action) => {
      if (action.visible === false) return false;
      if (typeof action.visible === "function" && !action.visible(uiCtx))
        return false;
      if (action.enabled === false) return false;
      if (typeof action.enabled === "function" && !action.enabled(uiCtx))
        return false;
      return true;
    });
  }

  /**
   * Get actions for context menu (filtered by visibility and enabled state).
   * @param uiCtx - Current UI context
   * @param targetElement - Target element for context
   * @returns Actions suitable for context menu
   */
  public getContextMenuActions(
    uiCtx: ReportWorkspaceUIContext,
    targetElement: HTMLElement,
  ): readonly RegisteredAction[] {
    // Context menu can have different filtering logic
    return this.getToolbarActions(uiCtx);
  }

  /**
   * Get all registered groups.
   * @returns Array of action groups sorted by order
   */
  public getGroups(): readonly ActionGroup[] {
    return Array.from(this.groups.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get a group by ID.
   * @param id - Group identifier
   * @returns Group or undefined
   */
  public getGroup(id: string): ActionGroup | undefined {
    return this.groups.get(id);
  }

  /**
   * Register or update a group.
   * @param group - Group configuration
   * @returns New ActionRegistry instance
   */
  public registerGroup(group: ActionGroup): ActionRegistry {
    const newRegistry = this.clone();
    newRegistry.groups.set(group.id, group);
    return newRegistry;
  }

  /**
   * Create a merged registry combining core and plugin actions.
   * This is the main pipeline merger for toolbar and context menu.
   * @param pluginRegistries - Array of plugin-specific registries
   * @returns Merged registry
   */
  public static merge(
    coreRegistry: ActionRegistry,
    ...pluginRegistries: ActionRegistry[]
  ): ActionRegistry {
    let merged = coreRegistry;
    for (const registry of pluginRegistries) {
      // Merge actions
      for (const action of registry.actions.values()) {
        merged.actions.set(action.id, action);
      }
      // Merge groups
      for (const group of registry.groups.values()) {
        merged.groups.set(group.id, group);
      }
      // Merge plugin action tracking
      for (const [pluginId, actionIds] of registry.pluginActions.entries()) {
        if (!merged.pluginActions.has(pluginId)) {
          merged.pluginActions.set(pluginId, new Set());
        }
        for (const actionId of actionIds) {
          merged.pluginActions.get(pluginId)!.add(actionId);
        }
      }
    }
    return merged;
  }

  /**
   * Create a default core registry with built-in actions.
   * @param uiCtx - UI context for action handlers
   * @param mutCtx - Mutable context for action handlers
   * @returns Default core ActionRegistry
   */
  public static createDefaultCore(
    uiCtx: ReportWorkspaceUIContext,
    mutCtx: ReportWorkspaceMutableContext,
  ): ActionRegistry {
    const registry = new ActionRegistry();

    // Register core groups
    registry.registerGroup({ id: "edit", label: "Edit", order: 10, icon: "✎" });
    registry.registerGroup({ id: "view", label: "View", order: 20, icon: "👁" });
    registry.registerGroup({
      id: "layout",
      label: "Layout",
      order: 30,
      icon: "⛶",
    });
    registry.registerGroup({
      id: "export",
      label: "Export",
      order: 40,
      icon: "⤓",
    });
    registry.registerGroup({
      id: "plugin",
      label: "Plugins",
      order: 90,
      icon: "🔌",
    });

    // Register core actions
    return registry
      .registerCoreAction({
        id: "copy-cell-value",
        group: "edit",
        label: "Copy Cell Value",
        order: 10,
        icon: "📋",
        action: (ui, mut) => {
          // Implementation delegated to SelectionService
          console.log("Copy Cell Value", ui, mut);
        },
        shortcut: "Ctrl+C",
      })
      .registerCoreAction({
        id: "freeze-layout",
        group: "layout",
        label: "Freeze Layout",
        order: 10,
        icon: "🔒",
        action: (ui, mut) => {
          console.log("Freeze Layout", ui, mut);
        },
      })
      .registerCoreAction({
        id: "auto-fit",
        group: "layout",
        label: "Auto Fit",
        order: 20,
        icon: "⛶",
        action: (ui, mut) => {
          mut.triggerAutoFit();
        },
        shortcut: "Ctrl+Shift+F",
      })
      .registerCoreAction({
        id: "zoom-in",
        group: "view",
        label: "Zoom In",
        order: 10,
        icon: "🔍+",
        action: (ui, mut) => {
          mut.setZoom((z) => Math.min(z + 10, 200));
        },
        shortcut: "Ctrl+=",
      })
      .registerCoreAction({
        id: "zoom-out",
        group: "view",
        label: "Zoom Out",
        order: 20,
        icon: "🔍-",
        action: (ui, mut) => {
          mut.setZoom((z) => Math.max(z - 10, 50));
        },
        shortcut: "Ctrl+-",
      })
      .registerCoreAction({
        id: "zoom-reset",
        group: "view",
        label: "Reset Zoom",
        order: 30,
        icon: "100%",
        action: (ui, mut) => {
          mut.setZoom(100);
        },
        shortcut: "Ctrl+0",
      })
      .registerCoreAction({
        id: "toggle-theme",
        group: "view",
        label: "Toggle Theme",
        order: 40,
        icon: "🌓",
        action: (ui, mut) => {
          mut.setIsDarkMode((d) => !d);
        },
        shortcut: "Ctrl+Shift+T",
      });
  }

  private ensureGroup(groupId: string): void {
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, {
        id: groupId,
        label: groupId.charAt(0).toUpperCase() + groupId.slice(1),
        order: 999,
      });
    }
  }

  private clone(): ActionRegistry {
    const cloned = new ActionRegistry();
    cloned.actions = new Map(this.actions);
    cloned.groups = new Map(this.groups);
    cloned.pluginActions = new Map(this.pluginActions);
    return cloned;
  }
}

/**
 * Default core action registry singleton.
 * Initialized lazily with UI/Mutable contexts.
 */
let defaultCoreRegistry: ActionRegistry | null = null;

export function getDefaultCoreRegistry(
  uiCtx: ReportWorkspaceUIContext,
  mutCtx: ReportWorkspaceMutableContext,
): ActionRegistry {
  if (!defaultCoreRegistry) {
    defaultCoreRegistry = ActionRegistry.createDefaultCore(uiCtx, mutCtx);
  }
  return defaultCoreRegistry;
}

export function resetDefaultCoreRegistry(): void {
  defaultCoreRegistry = null;
}
