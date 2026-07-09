import React from "react";

/**
 * Core reactive state messenger for the report workspace.
 * Acts as the single source of truth for all plugin interactions.
 */
export interface ReportWorkspaceContext {
  htmlContent: string;
  zoom: number;
  currentPage: number;
  totalPages: number;
  isDarkMode: boolean;
  autoFitScale: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  triggerAutoFit: () => void;
}

/**
 * Master blueprint interface for independent plugin components.
 * Defines the complete contract for plugin lifecycle and rendering hooks.
 */
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

/**
 * Immutable plugin registry for managing plugin lifecycle.
 * Provides type-safe registration and retrieval of workspace plugins.
 */
export interface ReportPluginRegistry {
  readonly plugins: ReadonlyMap<string, Readonly<ReportWorkspacePlugin>>;
  readonly register: (plugin: Readonly<ReportWorkspacePlugin>) => void;
  readonly unregister: (pluginId: string) => boolean;
  readonly get: (
    pluginId: string,
  ) => Readonly<ReportWorkspacePlugin> | undefined;
  readonly getAll: () => ReadonlyArray<Readonly<ReportWorkspacePlugin>>;
  readonly has: (pluginId: string) => boolean;
  readonly clear: () => void;
}

/**
 * Immutable configuration gateway for plugin initialization.
 * Provides type-safe configuration injection for plugin instances.
 */
export interface ReportPluginConfigGateway<
  Config extends Record<string, unknown>,
> {
  readonly config: Readonly<Config>;
  readonly getConfig: <Key extends keyof Config>(key: Key) => Config[Key];
  readonly hasConfig: (key: string) => boolean;
  readonly mergeConfig: <PartialConfig extends Partial<Config>>(
    partial: PartialConfig,
  ) => ReportPluginConfigGateway<Config & PartialConfig>;
}

/**
 * Immutable plugin execution context for runtime operations.
 * Provides controlled access to workspace state and plugin utilities.
 */
export interface ReportPluginExecutionContext<
  Config extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly workspace: Readonly<ReportWorkspaceContext>;
  readonly config: ReportPluginConfigGateway<Config>;
  readonly registry: Readonly<ReportPluginRegistry>;
  readonly emitEvent: <
    EventName extends string,
    Payload extends Record<string, unknown>,
  >(
    eventName: EventName,
    payload: Payload,
  ) => void;
  readonly onEvent: <
    EventName extends string,
    Payload extends Record<string, unknown>,
  >(
    eventName: EventName,
    handler: (payload: Payload) => void,
  ) => () => void;
}

/**
 * Immutable plugin factory for creating configured plugin instances.
 * Ensures type-safe plugin instantiation with configuration validation.
 */
export interface ReportPluginFactory<
  Plugin extends ReportWorkspacePlugin,
  Config extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly create: (
    config: Readonly<Config>,
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Readonly<Plugin>;
  readonly validateConfig: (config: unknown) => config is Config;
  readonly defaultConfig: Readonly<Config>;
}

/**
 * Immutable plugin manager for orchestrating plugin lifecycle.
 * Coordinates initialization, rendering, and event propagation.
 */
export interface ReportPluginManager<
  Config extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly initialize: (
    context: Readonly<ReportWorkspaceContext>,
    config: Readonly<Config>,
  ) => Promise<void>;
  readonly destroy: () => Promise<void>;
  readonly renderToolbarActions: (
    context: Readonly<ReportWorkspaceContext>,
  ) => React.ReactNode[];
  readonly renderContextMenuItems: (
    context: Readonly<ReportWorkspaceContext>,
    targetElement: HTMLElement,
  ) => React.ReactNode[];
  readonly getPlugin: <Plugin extends ReportWorkspacePlugin>(
    pluginId: string,
  ) => Readonly<Plugin> | undefined;
  readonly getAllPlugins: () => ReadonlyArray<Readonly<ReportWorkspacePlugin>>;
}

/**
 * Immutable configuration schema for plugin validation.
 * Defines the contract for plugin configuration structure.
 */
export interface ReportPluginConfigSchema<
  Config extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly properties: Readonly<
    Record<keyof Config, ReportPluginPropertySchema>
  >;
  readonly required: ReadonlyArray<keyof Config>;
  readonly additionalProperties: boolean;
}

/**
 * Individual property schema for plugin configuration validation.
 */
export interface ReportPluginPropertySchema {
  readonly type: "string" | "number" | "boolean" | "object" | "array";
  readonly description?: string;
  readonly default?: unknown;
  readonly enum?: ReadonlyArray<unknown>;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
}

/**
 * Immutable event payload for plugin communication.
 * Ensures type-safe event propagation across plugins.
 */
export interface ReportPluginEvent<
  EventName extends string = string,
  Payload extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly eventName: EventName;
  readonly payload: Readonly<Payload>;
  readonly timestamp: number;
  readonly sourcePluginId: string;
}

/**
 * Immutable plugin metadata for registry and discovery.
 */
export interface ReportPluginMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly dependencies: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly isEnabled: boolean;
}

/**
 * Immutable plugin state for persistence and hydration.
 */
export interface ReportPluginState<
  State extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly pluginId: string;
  readonly state: Readonly<State>;
  readonly version: number;
  readonly lastUpdated: number;
}

/**
 * Immutable plugin lifecycle hooks for advanced control.
 */
export interface ReportPluginLifecycleHooks<
  Config extends Record<string, unknown> = Record<string, unknown>,
  State extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly onBeforeInit?: (
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
  readonly onAfterInit?: (
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
  readonly onBeforeRender?: (
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
  readonly onAfterRender?: (
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
  readonly onBeforeDestroy?: (
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
  readonly onAfterDestroy?: (
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
  readonly onStateChange?: (
    previousState: Readonly<State>,
    nextState: Readonly<State>,
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
  readonly onConfigChange?: (
    previousConfig: Readonly<Config>,
    nextConfig: Readonly<Config>,
    context: Readonly<ReportPluginExecutionContext<Config>>,
  ) => Promise<void> | void;
}

/**
 * Immutable plugin definition combining all contracts.
 * Represents a complete, self-contained plugin module.
 */
export interface ReportPluginDefinition<
  Plugin extends ReportWorkspacePlugin,
  Config extends Record<string, unknown> = Record<string, unknown>,
  State extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly metadata: Readonly<ReportPluginMetadata>;
  readonly configSchema: Readonly<ReportPluginConfigSchema<Config>>;
  readonly factory: Readonly<ReportPluginFactory<Plugin, Config>>;
  readonly lifecycle: Readonly<ReportPluginLifecycleHooks<Config, State>>;
  readonly defaultState: Readonly<State>;
}

/**
 * Immutable plugin registry builder for fluent configuration.
 */
export interface ReportPluginRegistryBuilder {
  readonly withPlugin: <
    Plugin extends ReportWorkspacePlugin,
    Config extends Record<string, unknown> = Record<string, unknown>,
    State extends Record<string, unknown> = Record<string, unknown>,
  >(
    definition: Readonly<ReportPluginDefinition<Plugin, Config, State>>,
  ) => ReportPluginRegistryBuilder;
  readonly withConfig: <Config extends Record<string, unknown>>(
    config: Readonly<Config>,
  ) => ReportPluginRegistryBuilder;
  readonly build: () => Readonly<ReportPluginRegistry>;
}

/**
 * Immutable workspace plugin context for React integration.
 * Provides React context integration for plugin system.
 */
export interface ReportWorkspacePluginContextValue<
  Config extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly manager: Readonly<ReportPluginManager<Config>>;
  readonly context: Readonly<ReportWorkspaceContext>;
  readonly registry: Readonly<ReportPluginRegistry>;
}

/**
 * Type guard for validating plugin configuration objects.
 */
export function isValidPluginConfig<Config extends Record<string, unknown>>(
  config: unknown,
  schema: Readonly<ReportPluginConfigSchema<Config>>,
): config is Config {
  if (typeof config !== "object" || config === null) {
    return false;
  }

  const configRecord = config as Record<string, unknown>;
  const requiredKeys = schema.required as ReadonlyArray<string>;

  for (const key of requiredKeys) {
    if (!(key in configRecord)) {
      return false;
    }
  }

  if (!schema.additionalProperties) {
    const allowedKeys = new Set(Object.keys(schema.properties));
    for (const key of Object.keys(configRecord)) {
      if (!allowedKeys.has(key)) {
        return false;
      }
    }
  }

  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    const value = configRecord[key];
    if (value !== undefined && !validateProperty(value, propertySchema)) {
      return false;
    }
  }

  return true;
}

function validateProperty(
  value: unknown,
  schema: Readonly<ReportPluginPropertySchema>,
): boolean {
  switch (schema.type) {
    case "string":
      if (typeof value !== "string") return false;
      if (schema.minLength !== undefined && value.length < schema.minLength)
        return false;
      if (schema.maxLength !== undefined && value.length > schema.maxLength)
        return false;
      if (
        schema.pattern !== undefined &&
        !new RegExp(schema.pattern).test(value)
      )
        return false;
      if (schema.enum !== undefined && !schema.enum.includes(value))
        return false;
      return true;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) return false;
      if (schema.minimum !== undefined && value < schema.minimum) return false;
      if (schema.maximum !== undefined && value > schema.maximum) return false;
      if (schema.enum !== undefined && !schema.enum.includes(value))
        return false;
      return true;
    case "boolean":
      return typeof value === "boolean";
    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value))
        return false;
      return true;
    case "array":
      if (!Array.isArray(value)) return false;
      return true;
    default:
      return false;
  }
}

/**
 * Creates an immutable plugin registry with type-safe operations.
 */
export function createPluginRegistry(): Readonly<ReportPluginRegistry> {
  const plugins = new Map<string, Readonly<ReportWorkspacePlugin>>();

  return Object.freeze({
    get plugins() {
      return plugins;
    },
    register(plugin: Readonly<ReportWorkspacePlugin>): void {
      if (plugins.has(plugin.id)) {
        throw new Error(`Plugin with id "${plugin.id}" is already registered`);
      }
      plugins.set(plugin.id, plugin);
    },
    unregister(pluginId: string): boolean {
      return plugins.delete(pluginId);
    },
    get(pluginId: string): Readonly<ReportWorkspacePlugin> | undefined {
      return plugins.get(pluginId);
    },
    getAll(): ReadonlyArray<Readonly<ReportWorkspacePlugin>> {
      return Array.from(plugins.values());
    },
    has(pluginId: string): boolean {
      return plugins.has(pluginId);
    },
    clear(): void {
      plugins.clear();
    },
  });
}

/**
 * Creates an immutable plugin configuration gateway.
 */
export function createPluginConfigGateway<
  Config extends Record<string, unknown>,
>(config: Readonly<Config>): Readonly<ReportPluginConfigGateway<Config>> {
  const gateway: ReportPluginConfigGateway<Config> = {
    get config() {
      return config;
    },
    getConfig<Key extends keyof Config>(key: Key): Config[Key] {
      return config[key];
    },
    hasConfig(key: string): boolean {
      return key in config;
    },
    mergeConfig<PartialConfig extends Partial<Config>>(
      partial: PartialConfig,
    ): ReportPluginConfigGateway<Config & PartialConfig> {
      return createPluginConfigGateway({ ...config, ...partial } as Config &
        PartialConfig) as ReportPluginConfigGateway<Config & PartialConfig>;
    },
  };
  return Object.freeze(gateway);
}
