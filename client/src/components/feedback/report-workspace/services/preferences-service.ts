/**
 * Preferences Service - Localized preference layout with pluggable state persistence hooks.
 * Clean boilerplate-free vanilla TypeScript core service class.
 * Uses generic interface abstraction contract layer for storage providers.
 */

// No external context imports needed for preferences service

/**
 * Storage provider interface for pluggable persistence.
 * Implementations can use localStorage, sessionStorage, IndexedDB, cookies, etc.
 */
export interface StorageProvider {
  /**
   * Get an item from storage.
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
  getItem(key: string): string | null;

  /**
   * Set an item in storage.
   * @param key - Storage key
   * @param value - Value to store
   */
  setItem(key: string, value: string): void;

  /**
   * Remove an item from storage.
   * @param key - Storage key
   */
  removeItem(key: string): void;

  /**
   * Clear all items from storage.
   */
  clear(): void;

  /**
   * Get all keys in storage.
   * @returns Array of keys
   */
  keys(): readonly string[];
}

/**
 * Default localStorage provider implementation.
 */
export class LocalStorageProvider implements StorageProvider {
  private prefix: string;

  constructor(prefix = "report-workspace:") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  public getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.getKey(key));
    } catch {
      return null;
    }
  }

  public setItem(key: string, value: string): void {
    try {
      localStorage.setItem(this.getKey(key), value);
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  public removeItem(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  }

  public clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(this.prefix),
      );
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  }

  public keys(): readonly string[] {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith(this.prefix))
        .map((k) => k.slice(this.prefix.length));
    } catch {
      return [];
    }
  }
}

/**
 * In-memory storage provider (for testing or SSR).
 */
export class MemoryStorageProvider implements StorageProvider {
  private store: Map<string, string> = new Map();

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public keys(): readonly string[] {
    return Array.from(this.store.keys());
  }
}

/**
 * Preference keys for type-safe access.
 */
export type PreferenceKey =
  | "zoom"
  | "isDarkMode"
  | "fitMode"
  | "currentPage"
  | "autoFitScale"
  | "showWarningBanner"
  | string; // Allow custom keys

/**
 * Preference value types.
 */
export type PreferenceValue = number | boolean | string | null | undefined;

/**
 * Preferences schema for validation and defaults.
 */
export interface PreferenceSchemaEntry {
  default: PreferenceValue;
  min?: number;
  max?: number;
  options?: readonly string[];
}

export interface PreferencesSchema {
  zoom: PreferenceSchemaEntry;
  isDarkMode: PreferenceSchemaEntry;
  fitMode: PreferenceSchemaEntry;
  currentPage: PreferenceSchemaEntry;
  autoFitScale: PreferenceSchemaEntry;
  showWarningBanner: PreferenceSchemaEntry;
  [key: string]: PreferenceSchemaEntry | undefined;
}

/**
 * Default preferences schema.
 */
export const DEFAULT_PREFERENCES_SCHEMA: PreferencesSchema = {
  zoom: { default: 100, min: 50, max: 200 },
  isDarkMode: { default: false },
  fitMode: { default: "width", options: ["width", "height", "page", "none"] },
  currentPage: { default: 1, min: 1 },
  autoFitScale: { default: 1, min: 0.1, max: 5 },
  showWarningBanner: { default: false },
};

/**
 * Preferences change event.
 */
export interface PreferencesChangeEvent {
  key: PreferenceKey;
  previousValue: PreferenceValue;
  currentValue: PreferenceValue;
  timestamp: number;
}

/**
 * Preferences Service - Manages localized preferences with pluggable storage.
 * Provides type-safe access to zoom, isDarkMode, fitMode, and custom preferences.
 */
export class PreferencesService {
  private storage: StorageProvider;
  private schema: PreferencesSchema;
  private cache: Map<string, PreferenceValue> = new Map();
  private changeListeners: Set<(event: PreferencesChangeEvent) => void> =
    new Set();
  private initialized = false;

  /**
   * Create a new preferences service.
   * @param storage - Storage provider implementation
   * @param schema - Preferences schema (optional, uses defaults)
   */
  constructor(
    storage: StorageProvider,
    schema: Partial<PreferencesSchema> = {},
  ) {
    this.storage = storage;
    this.schema = { ...DEFAULT_PREFERENCES_SCHEMA, ...schema };
  }

  /**
   * Initialize the service (load from storage).
   */
  public initialize(): void {
    if (this.initialized) return;

    const schemaKeys = Object.keys(this.schema) as string[];
    for (const key of schemaKeys) {
      const stored = this.storage.getItem(key);
      const schemaEntry = this.schema[key];
      if (!schemaEntry) continue;

      if (stored !== null) {
        try {
          const parsed = JSON.parse(stored);
          this.cache.set(key, this.validateValue(key, parsed));
        } catch {
          // Use default if parsing fails
          this.cache.set(key, schemaEntry.default);
        }
      } else {
        this.cache.set(key, schemaEntry.default);
      }
    }

    this.initialized = true;
  }

  /**
   * Get a preference value.
   * @param key - Preference key
   * @returns Preference value or default
   */
  public get<T extends PreferenceValue>(key: PreferenceKey): T {
    if (!this.initialized) this.initialize();
    return (this.cache.get(key) ?? this.schema[key]?.default) as T;
  }

  /**
   * Set a preference value.
   * @param key - Preference key
   * @param value - Value to set
   */
  public set(key: PreferenceKey, value: PreferenceValue): void {
    if (!this.initialized) this.initialize();

    const previousValue = this.cache.get(key);
    const validatedValue = this.validateValue(key, value);

    this.cache.set(key, validatedValue);

    try {
      this.storage.setItem(key, JSON.stringify(validatedValue));
    } catch (error) {
      console.warn(`Failed to persist preference "${key}":`, error);
    }

    this.notifyChange({
      key,
      previousValue,
      currentValue: validatedValue,
      timestamp: Date.now(),
    });
  }

  /**
   * Get zoom level (0-200).
   * @returns Current zoom level
   */
  public getZoom(): number {
    return this.get<number>("zoom");
  }

  /**
   * Set zoom level.
   * @param zoom - Zoom level (50-200)
   */
  public setZoom(zoom: number): void {
    this.set("zoom", Math.max(50, Math.min(200, zoom)));
  }

  /**
   * Get dark mode state.
   * @returns True if dark mode enabled
   */
  public getIsDarkMode(): boolean {
    return this.get<boolean>("isDarkMode");
  }

  /**
   * Set dark mode state.
   * @param isDarkMode - Dark mode enabled
   */
  public setIsDarkMode(isDarkMode: boolean): void {
    this.set("isDarkMode", isDarkMode);
  }

  /**
   * Get fit mode.
   * @returns Current fit mode
   */
  public getFitMode(): string {
    return this.get<string>("fitMode");
  }

  /**
   * Set fit mode.
   * @param fitMode - Fit mode value
   */
  public setFitMode(fitMode: string): void {
    const options = this.schema.fitMode.options ?? [];
    if (options.length > 0 && !options.includes(fitMode)) {
      console.warn(
        `Invalid fit mode: ${fitMode}. Valid options: ${options.join(", ")}`,
      );
      return;
    }
    this.set("fitMode", fitMode);
  }

  /**
   * Get current page.
   * @returns Current page number
   */
  public getCurrentPage(): number {
    return this.get<number>("currentPage");
  }

  /**
   * Set current page.
   * @param page - Page number
   */
  public setCurrentPage(page: number): void {
    this.set("currentPage", Math.max(1, page));
  }

  /**
   * Get auto-fit scale.
   * @returns Auto-fit scale factor
   */
  public getAutoFitScale(): number {
    return this.get<number>("autoFitScale");
  }

  /**
   * Set auto-fit scale.
   * @param scale - Scale factor
   */
  public setAutoFitScale(scale: number): void {
    this.set("autoFitScale", Math.max(0.1, Math.min(5, scale)));
  }

  /**
   * Get warning banner visibility.
   * @returns True if warning banner should show
   */
  public getShowWarningBanner(): boolean {
    return this.get<boolean>("showWarningBanner");
  }

  /**
   * Set warning banner visibility.
   * @param show - Show warning banner
   */
  public setShowWarningBanner(show: boolean): void {
    this.set("showWarningBanner", show);
  }

  /**
   * Get all preferences as a plain object.
   * @returns All preferences
   */
  public getAll(): Record<string, PreferenceValue> {
    if (!this.initialized) this.initialize();
    const result: Record<string, PreferenceValue> = {};
    for (const [key, value] of this.cache.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Reset all preferences to defaults.
   */
  public resetToDefaults(): void {
    if (!this.initialized) this.initialize();

    const schemaKeys = Object.keys(this.schema) as string[];
    for (const key of schemaKeys) {
      const schemaEntry = this.schema[key];
      if (!schemaEntry) continue;

      const defaultValue = schemaEntry.default;
      this.cache.set(key, defaultValue);
      this.storage.setItem(key, JSON.stringify(defaultValue));
    }

    this.notifyChange({
      key: "*" as PreferenceKey,
      previousValue: null,
      currentValue: null,
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to preference changes.
   * @param listener - Change listener
   * @returns Unsubscribe function
   */
  public subscribe(
    listener: (event: PreferencesChangeEvent) => void,
  ): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Validate and coerce a value according to schema.
   * @param key - Preference key
   * @param value - Value to validate
   * @returns Validated value
   */
  private validateValue(key: string, value: PreferenceValue): PreferenceValue {
    const schema = this.schema[key];
    if (!schema) return value;

    if (
      typeof value === "number" &&
      schema.min !== undefined &&
      schema.max !== undefined
    ) {
      return Math.max(schema.min, Math.min(schema.max, value));
    }

    if (
      typeof value === "string" &&
      schema.options &&
      schema.options.length > 0
    ) {
      return schema.options.includes(value) ? value : schema.default;
    }

    return value ?? schema.default;
  }

  /**
   * Notify all listeners of preference change.
   * @param event - Change event
   */
  private notifyChange(event: PreferencesChangeEvent): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Preferences change listener error:", error);
      }
    }
  }
}

/**
 * Preferences Service Factory - Creates configured preferences service instances.
 */
export class PreferencesServiceFactory {
  /**
   * Create a new preferences service with localStorage.
   * @param prefix - Storage key prefix
   * @param schema - Custom schema (optional)
   * @returns New PreferencesService instance
   */
  public static createWithLocalStorage(
    prefix = "report-workspace:",
    schema?: Partial<PreferencesSchema>,
  ): PreferencesService {
    return new PreferencesService(new LocalStorageProvider(prefix), schema);
  }

  /**
   * Create a new preferences service with in-memory storage.
   * @param schema - Custom schema (optional)
   * @returns New PreferencesService instance
   */
  public static createWithMemory(
    schema?: Partial<PreferencesSchema>,
  ): PreferencesService {
    return new PreferencesService(new MemoryStorageProvider(), schema);
  }

  /**
   * Create a new preferences service with custom storage provider.
   * @param storage - Custom storage provider
   * @param schema - Custom schema (optional)
   * @returns New PreferencesService instance
   */
  public static create(
    storage: StorageProvider,
    schema?: Partial<PreferencesSchema>,
  ): PreferencesService {
    return new PreferencesService(storage, schema);
  }
}
