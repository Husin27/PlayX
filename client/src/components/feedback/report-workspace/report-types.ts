/**
 * Strict type contracts for the Report Workspace system.
 * Zero `any` usage. Strict discriminated unions for plugin types.
 * Zero `any` usage. Strict discriminated unions for plugin types.
 */

// ============================================================================
// Core Domain Types
// ============================================================================

/** Unique identifier for a report */
export type ReportId = string & { readonly __brand: unique symbol };

/** Unique identifier for a plugin */
export type PluginId = string & { readonly __brand: unique symbol };

/** Unique identifier for a DOM element within the report */
export type ElementId = string & { readonly __brand: unique symbol };

/** Unique identifier for a data source */
export type DataSourceId = string & { readonly __brand: unique symbol };

/** Unique identifier for a layout */
export type LayoutId = string & { readonly __brand: unique symbol };

/** Unique identifier for a style rule */
export type StyleRuleId = string & { readonly __brand: unique symbol };

/** Unique identifier for a data binding */
export type BindingId = string & { readonly __brand: unique symbol };

// ============================================================================
// Branding Helpers (internal use only)
// ============================================================================

/** @internal */
export const brand = {
  reportId: (id: string): ReportId => id as ReportId,
  pluginId: (id: string): PluginId => id as PluginId,
  elementId: (id: string): ElementId => id as ElementId,
  dataSourceId: (id: string): DataSourceId => id as DataSourceId,
  layoutId: (id: string): LayoutId => id as LayoutId,
  styleRuleId: (id: string): StyleRuleId => id as StyleRuleId,
  bindingId: (id: string): BindingId => id as BindingId,
} as const;

// ============================================================================
// Report Definition Types
// ============================================================================

export interface ReportWorkspaceState {
  zoom: number;
  currentPage: number;
  totalPages: number;
  isDarkMode: boolean;
  autoFitScale: number;
  showWarningBanner: boolean;
}

export interface AutoFitResult {
  success: boolean;
  finalScale: number;
  shouldWarn: boolean;
}

/** Supported report output formats */
export type OutputFormat = "pdf" | "html" | "excel" | "csv" | "json";

/** Report page orientation */
export type PageOrientation = "portrait" | "landscape";

/** Paper size standards */
export type PaperSize = "A4" | "A3" | "Letter" | "Legal" | "Custom";

/** Custom paper dimensions */
export interface CustomPaperSize {
  width: number; // in millimeters
  height: number; // in millimeters
}

/** Paper configuration */
export type PaperConfig =
  | { type: Exclude<PaperSize, "Custom">; orientation: PageOrientation }
  | { type: "Custom"; size: CustomPaperSize; orientation: PageOrientation };

/** Page margin configuration (in millimeters) */
export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Report page configuration */
export interface PageConfig {
  paper: PaperConfig;
  margins: PageMargins;
  headerHeight?: number; // mm
  footerHeight?: number; // mm
}

/** Report metadata */
export interface ReportMetadata {
  id: ReportId;
  name: string;
  description?: string;
  version: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

/** Complete report definition */
export interface ReportDefinition {
  metadata: ReportMetadata;
  pageConfig: PageConfig;
  dataSources: DataSourceConfig[];
  layouts: LayoutConfig[];
  styleRules: StyleRuleConfig[];
  bindings: BindingConfig[];
  plugins: PluginConfig[];
}

/** Data source configuration */
export interface DataSourceConfig {
  id: DataSourceId;
  name: string;
  type: DataSourceType;
  config: Record<string, unknown>;
  refreshInterval?: number; // milliseconds, 0 = manual
}

/** Supported data source types */
export type DataSourceType =
  "sql" | "rest" | "graphql" | "csv" | "json" | "static" | "function";

/** Layout configuration */
export interface LayoutConfig {
  id: LayoutId;
  name: string;
  type: LayoutType;
  rootElement: ElementConfig;
  conditions?: LayoutCondition[];
}

/** Layout types */
export type LayoutType =
  "page" | "band" | "freeform" | "table" | "chart" | "custom";

/** Layout condition for conditional rendering */
export interface LayoutCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

/** Condition operators */
export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "notIn"
  | "isNull"
  | "isNotNull"
  | "between";

/** Element configuration */
export interface ElementConfig {
  id: ElementId;
  type: ElementType;
  name?: string;
  style?: ElementStyleConfig;
  bindings?: BindingRef[];
  children?: ElementConfig[];
  conditions?: LayoutCondition[];
  pluginId?: PluginId;
  pluginConfig?: Record<string, unknown>;
}

/** Element types */
export type ElementType =
  | "container"
  | "text"
  | "image"
  | "table"
  | "chart"
  | "barcode"
  | "qr"
  | "chart"
  | "subreport"
  | "pageBreak"
  | "line"
  | "rectangle"
  | "custom";

/** Element style configuration */
export interface ElementStyleConfig {
  // Layout
  display?: "block" | "inline" | "flex" | "grid" | "none";
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  margin?: string;
  padding?: string;

  // Flexbox
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  alignItems?: "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
  alignContent?:
    | "stretch"
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around";
  flex?: string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;

  // Grid
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;

  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  fontStyle?: "normal" | "italic" | "oblique";
  lineHeight?: string | number;
  letterSpacing?: string;
  textAlign?: "left" | "right" | "center" | "justify" | "start" | "end";
  textDecoration?: string;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  whiteSpace?: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line";
  wordBreak?: "normal" | "break-all" | "keep-all" | "break-word";
  overflow?: "visible" | "hidden" | "scroll" | "auto" | "clip";
  textOverflow?: "clip" | "ellipsis" | string;

  // Colors
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?:
    | "none"
    | "solid"
    | "dashed"
    | "dotted"
    | "double"
    | "groove"
    | "ridge"
    | "inset"
    | "outset";
  borderRadius?: string;
  boxShadow?: string;
  opacity?: number;

  // Print
  pageBreakBefore?:
    "auto" | "always" | "avoid" | "left" | "right" | "recto" | "verso";
  pageBreakAfter?:
    "auto" | "always" | "avoid" | "left" | "right" | "recto" | "verso";
  pageBreakInside?: "auto" | "avoid";

  // Custom properties (CSS custom properties)
  customProperties?: Record<string, string>;
}

/** Binding reference */
export interface BindingRef {
  bindingId: BindingId;
  path?: string; // JSON path for nested data
  formatter?: string; // formatter name
  formatterArgs?: Record<string, unknown>;
}

/** Binding configuration */
export interface BindingConfig {
  id: BindingId;
  name: string;
  dataSourceId: DataSourceId;
  query: string; // SQL, GraphQL, REST path, etc.
  parameters?: Record<string, unknown>;
  transform?: BindingTransform;
}

/** Binding transformation */
export interface BindingTransform {
  type:
    "map" | "filter" | "reduce" | "groupBy" | "sort" | "paginate" | "custom";
  config: Record<string, unknown>;
}

/** Style rule configuration */
export interface StyleRuleConfig {
  id: StyleRuleId;
  name: string;
  selector: string; // CSS selector
  style: ElementStyleConfig;
  priority: number; // higher = more specific
  conditions?: LayoutCondition[];
}

/** Plugin configuration */
export interface PluginConfig {
  id: PluginId;
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, unknown>;
  elementTypes?: ElementType[]; // element types this plugin handles
}

// ============================================================================
// Runtime Types (Runtime State)
// ============================================================================

/** Report execution context */
export interface ReportContext {
  report: ReportDefinition;
  data: ReportData;
  parameters: ReportParameters;
  runtime: RuntimeContext;
}

/** Resolved report data */
export interface ReportData {
  [dataSourceId: DataSourceId]: unknown[];
}

/** Report parameters */
export interface ReportParameters {
  [key: string]: unknown;
}

/** Runtime context */
export interface RuntimeContext {
  reportId: ReportId;
  startTime: Date;
  currentPage: number;
  totalPages: number;
  variables: Record<string, unknown>;
  plugins: Map<PluginId, PluginInstance>;
  elements: Map<ElementId, RenderedElement>;
  styles: ComputedStyleMap;
  bindings: ResolvedBindingMap;
}

/** Rendered element in the DOM */
export interface RenderedElement {
  id: ElementId;
  config: ElementConfig;
  domElement: HTMLElement | null;
  computedStyle: ComputedStyle;
  bounds: ElementBounds | null;
  children: RenderedElement[];
  parent: RenderedElement | null;
  dataContext: unknown;
  bindings: ResolvedBinding[];
}

/** Computed style for an element */
export interface ComputedStyle {
  [property: string]: string | number | undefined;
}

/** Element bounding box */
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

/** Computed style map */
export type ComputedStyleMap = Map<ElementId, ComputedStyle>;

/** Resolved binding with data */
export interface ResolvedBinding {
  config: BindingConfig;
  data: unknown;
  formattedValue: string | null;
  error?: Error;
}

/** Resolved binding map */
export type ResolvedBindingMap = Map<BindingId, ResolvedBinding>;

/** Plugin instance at runtime */
export interface PluginInstance {
  config: PluginConfig;
  instance: PluginEngine;
  elements: Map<ElementId, RenderedElement>;
  initialized: boolean;
  destroyed: boolean;
}

// ============================================================================
// Plugin System Types (Discriminated Unions - Zero `any`)
// ============================================================================

/** Base plugin engine interface */
export interface PluginEngine {
  readonly id: PluginId;
  readonly name: string;
  readonly version: string;
  readonly supportedElementTypes: readonly ElementType[];

  /** Initialize the plugin */
  initialize(context: PluginInitContext): Promise<void> | void;

  /** Render an element */
  renderElement(
    element: RenderedElement,
    context: RenderContext,
  ): Promise<RenderResult> | RenderResult;

  /** Update an element with new data */
  updateElement(
    element: RenderedElement,
    context: RenderContext,
  ): Promise<UpdateResult> | UpdateResult;

  /** Destroy/cleanup the plugin */
  destroy(): Promise<void> | void;

  /** Handle custom events */
  handleEvent?(event: PluginEvent): Promise<void> | void;
}

/** Plugin initialization context */
export interface PluginInitContext {
  reportContext: ReportContext;
  pluginConfig: PluginConfig;
  domEngine: DOMEngine;
  styleEngine: StyleEngine;
  bindingEngine: BindingEngine;
}

/** Render context for plugin rendering */
export interface RenderContext {
  element: RenderedElement;
  reportContext: ReportContext;
  domEngine: DOMEngine;
  styleEngine: StyleEngine;
  bindingEngine: BindingEngine;
  parentElement: HTMLElement | null;
}

/** Render result from plugin */
export interface RenderResult {
  success: boolean;
  domElement?: HTMLElement;
  error?: Error;
  warnings?: string[];
  measurements?: ElementMeasurements;
}

/** Element measurements */
export interface ElementMeasurements {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

/** Update result from plugin */
export interface UpdateResult {
  success: boolean;
  changed: boolean;
  error?: Error;
  warnings?: string[];
}

/** Plugin event */
export interface PluginEvent {
  type: PluginEventType;
  source: PluginId;
  target?: PluginId;
  payload: unknown;
  timestamp: Date;
}

/** Plugin event types */
export type PluginEventType =
  | "element:render"
  | "element:update"
  | "element:destroy"
  | "data:refresh"
  | "page:break"
  | "page:render"
  | "style:change"
  | "binding:resolve"
  | "custom";

/** Plugin initialization context (alias for clarity) */
export type PluginInitContextAlias = PluginInitContext;

/** DOMEngine interface for DOM operations */
export interface DOMEngine {
  createElement(tag: string, options?: ElementCreationOptions): HTMLElement;
  createTextNode(text: string): Text;
  appendChild(parent: HTMLElement, child: Node): void;
  removeChild(parent: HTMLElement, child: Node): void;
  replaceChild(parent: HTMLElement, newChild: Node, oldChild: Node): void;
  setAttribute(element: HTMLElement, name: string, value: string): void;
  removeAttribute(element: HTMLElement, name: string): void;
  setStyle(
    element: HTMLElement,
    property: string,
    value: string | number,
  ): void;
  getComputedStyle(element: HTMLElement): ComputedStyle;
  measureElement(element: HTMLElement): ElementMeasurements;
  querySelector(selector: string, root?: HTMLElement): HTMLElement | null;
  querySelectorAll(selector: string, root?: HTMLElement): HTMLElement[];
  addEventListener(
    element: HTMLElement,
    event: string,
    handler: (event: Event) => void,
  ): void;
  removeEventListener(
    element: HTMLElement,
    event: string,
    handler: (event: Event) => void,
  ): void;
  getContainer(): HTMLElement | null;
  getPages(): NodeListOf<HTMLElement>;
}

/** Element creation options */
export interface ElementCreationOptions {
  id?: string;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  attributes?: Record<string, string>;
  dataset?: Record<string, string>;
  children?: (HTMLElement | Text)[];
}

/** StyleEngine interface */
export interface StyleEngine {
  computeStyle(
    element: RenderedElement,
    rules: StyleRuleConfig[],
  ): ComputedStyle;
  applyStyle(element: HTMLElement, style: ComputedStyle): void;
  resolveCustomProperties(
    style: ComputedStyle,
    context: StyleContext,
  ): ComputedStyle;
  matchSelector(element: RenderedElement, selector: string): boolean;
  getSpecificity(selector: string): number;
}

/** Style context for custom property resolution */
export interface StyleContext {
  variables: Record<string, string>;
  theme: ThemeConfig;
  parent?: StyleContext;
}

/** Theme configuration */
export interface ThemeConfig {
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
  customProperties: Record<string, string>;
}

/** BindingEngine interface */
export interface BindingEngine {
  resolveBinding(
    binding: BindingConfig,
    data: ReportData,
    parameters: ReportParameters,
  ): Promise<ResolvedBinding>;
  resolveBindings(
    bindings: BindingConfig[],
    data: ReportData,
    parameters: ReportParameters,
  ): Promise<ResolvedBindingMap>;
  formatValue(
    value: unknown,
    formatter: string,
    args?: Record<string, unknown>,
  ): string;
  registerFormatter(name: string, formatter: ValueFormatter): void;
  unregisterFormatter(name: string): void;
}

/** Value formatter function */
export type ValueFormatter = (
  value: unknown,
  args?: Record<string, unknown>,
) => string;

/** Plugin event type (discriminated union for events) */
export type PluginEventMap = {
  "element:render": { element: RenderedElement; context: RenderContext };
  "element:update": {
    element: RenderedElement;
    context: RenderContext;
    previousData: unknown;
  };
  "element:destroy": { element: RenderedElement };
  "data:refresh": { dataSourceId: DataSourceId; data: unknown[] };
  "page:break": { pageNumber: number; reason: PageBreakReason };
  "page:render": { pageNumber: number; elements: RenderedElement[] };
  "style:change": {
    element: RenderedElement;
    oldStyle: ComputedStyle;
    newStyle: ComputedStyle;
  };
  "binding:resolve": { binding: BindingConfig; result: ResolvedBinding };
  custom: { eventName: string; payload: unknown };
};

/** Page break reasons */
export type PageBreakReason =
  | "content-overflow"
  | "explicit-break"
  | "page-break-before"
  | "page-break-after"
  | "keep-together-violation";

/** Plugin registry entry */
export interface PluginRegistryEntry {
  engine: PluginEngine;
  config: PluginConfig;
  registeredAt: Date;
  enabled: boolean;
}

/** Plugin registry */
export interface PluginRegistry {
  register(engine: PluginEngine, config: PluginConfig): void;
  unregister(pluginId: PluginId): boolean;
  get(pluginId: PluginId): PluginRegistryEntry | undefined;
  getAll(): PluginRegistryEntry[];
  getByElementType(elementType: ElementType): PluginRegistryEntry[];
  isEnabled(pluginId: PluginId): boolean;
  setEnabled(pluginId: PluginId, enabled: boolean): boolean;
}

// ============================================================================
// Engine Interfaces
// ============================================================================

/** Report engine interface */
export interface ReportEngine {
  readonly context: ReportContext;

  /** Initialize the report engine */
  initialize(definition: ReportDefinition): Promise<void>;

  /** Render the report */
  render(options?: RenderOptions): Promise<RenderOutput>;

  /** Update report data */
  updateData(dataSourceId: DataSourceId, data: unknown[]): Promise<void>;

  /** Update report parameters */
  updateParameters(parameters: ReportParameters): Promise<void>;

  /** Export report */
  export(format: OutputFormat, options?: ExportOptions): Promise<ExportResult>;

  /** Destroy the engine */
  destroy(): Promise<void>;

  /** Get plugin registry */
  getPluginRegistry(): PluginRegistry;

  /** Get DOM engine */
  getDOMEngine(): DOMEngine;

  /** Get Style engine */
  getStyleEngine(): StyleEngine;

  /** Get Binding engine */
  getBindingEngine(): BindingEngine;
}

/** Render options */
export interface RenderOptions {
  format?: OutputFormat;
  target?: "dom" | "pdf" | "string";
  container?: HTMLElement;
  pages?: number[]; // specific pages to render
  onProgress?: (progress: RenderProgress) => void;
}

/** Render progress */
export interface RenderProgress {
  phase: RenderPhase;
  currentPage: number;
  totalPages: number;
  processedElements: number;
  totalElements: number;
}

/** Render phases */
export type RenderPhase =
  | "preparing"
  | "layout"
  | "rendering"
  | "measuring"
  | "paginating"
  | "complete"
  | "error";

/** Render output */
export interface RenderOutput {
  success: boolean;
  output?: HTMLElement | string | Blob;
  pages: RenderedPage[];
  errors: RenderError[];
  warnings: RenderWarning[];
  metrics: RenderMetrics;
}

/** Rendered page */
export interface RenderedPage {
  pageNumber: number;
  element: HTMLElement;
  elements: RenderedElement[];
  bounds: PageBounds;
}

/** Page bounds */
export interface PageBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Render error */
export interface RenderError {
  elementId?: ElementId;
  pluginId?: PluginId;
  message: string;
  error?: Error;
  severity: "error" | "warning" | "info";
}

/** Render warning */
export interface RenderWarning {
  elementId?: ElementId;
  pluginId?: PluginId;
  message: string;
  code?: string;
}

/** Render metrics */
export interface RenderMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  pagesRendered: number;
  elementsRendered: number;
  bindingsResolved: number;
  stylesComputed: number;
  memoryUsed?: number;
}

/** Export options */
export interface ExportOptions {
  filename?: string;
  quality?: number; // for PDF/images
  includeFonts?: boolean;
  embedFonts?: boolean;
  metadata?: Record<string, string>;
}

/** Export result */
export interface ExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  filename?: string;
  error?: Error;
  metadata?: ExportMetadata;
}

/** Export metadata */
export interface ExportMetadata {
  format: OutputFormat;
  pageCount: number;
  fileSize: number;
  generatedAt: Date;
  reportId: ReportId;
}

// ============================================================================
// Layout Engine Types
// ============================================================================

/** Layout engine interface */
export interface LayoutEngine {
  /** Calculate layout for a page */
  layoutPage(page: LayoutPage, context: LayoutContext): Promise<LayoutResult>;

  /** Calculate element position */
  calculatePosition(
    element: LayoutElement,
    context: LayoutContext,
  ): ElementPosition;

  /** Check if element fits in remaining space */
  fitsInSpace(element: LayoutElement, availableSpace: AvailableSpace): boolean;

  /** Split element across pages */
  splitElement(
    element: LayoutElement,
    availableSpace: AvailableSpace,
  ): SplitResult;
}

/** Layout page */
export interface LayoutPage {
  pageNumber: number;
  bounds: PageBounds;
  contentArea: ContentArea;
  elements: LayoutElement[];
}

/** Content area (page bounds minus margins) */
export interface ContentArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Layout element */
export interface LayoutElement {
  id: ElementId;
  config: ElementConfig;
  computedStyle: ComputedStyle;
  measuredSize: ElementMeasurements;
  children: LayoutElement[];
  dataContext: unknown;
}

/** Layout context */
export interface LayoutContext {
  pageConfig: PageConfig;
  currentPage: number;
  contentArea: ContentArea;
  currentPosition: Position;
  stack: LayoutStack[];
  variables: Record<string, unknown>;
}

/** Position */
export interface Position {
  x: number;
  y: number;
}

/** Layout stack entry */
export interface LayoutStack {
  element: LayoutElement;
  startPosition: Position;
  children: LayoutElement[];
}

/** Available space */
export interface AvailableSpace {
  width: number;
  height: number;
  x: number;
  y: number;
}

/** Element position result */
export interface ElementPosition {
  x: number;
  y: number;
  pageNumber: number;
  fits: boolean;
  overflow?: OverflowInfo;
}

/** Overflow information */
export interface OverflowInfo {
  overflowX: number;
  overflowY: number;
  canSplit: boolean;
}

/** Layout result */
export interface LayoutResult {
  success: boolean;
  pages: LayoutPage[];
  errors: LayoutError[];
  warnings: LayoutWarning[];
}

/** Layout error */
export interface LayoutError {
  elementId: ElementId;
  message: string;
  code: string;
}

/** Layout warning */
export interface LayoutWarning {
  elementId: ElementId;
  message: string;
  code: string;
}

/** Split result */
export interface SplitResult {
  firstPart: LayoutElement;
  secondPart: LayoutElement | null;
  splitPosition: number;
}

// ============================================================================
// Event System Types
// ============================================================================

/** Report event types */
export type ReportEventType =
  | "report:init"
  | "report:render-start"
  | "report:render-complete"
  | "report:render-error"
  | "report:data-changed"
  | "report:parameter-changed"
  | "report:export-start"
  | "report:export-complete"
  | "report:export-error"
  | "report:destroy"
  | "page:render-start"
  | "page:render-complete"
  | "page:break"
  | "element:render-start"
  | "element:render-complete"
  | "element:update"
  | "element:destroy"
  | "binding:resolve"
  | "binding:error"
  | "style:compute"
  | "style:apply"
  | "plugin:register"
  | "plugin:unregister"
  | "plugin:event";

/** Report event map (discriminated union) */
export type ReportEventMap = {
  "report:init": { report: ReportDefinition };
  "report:render-start": { options: RenderOptions };
  "report:render-complete": { output: RenderOutput };
  "report:render-error": { error: Error; options: RenderOptions };
  "report:data-changed": { dataSourceId: DataSourceId; data: unknown[] };
  "report:parameter-changed": { parameters: ReportParameters };
  "report:export-start": { format: OutputFormat; options: ExportOptions };
  "report:export-complete": { result: ExportResult };
  "report:export-error": {
    error: Error;
    format: OutputFormat;
    options: ExportOptions;
  };
  "report:destroy": { reportId: ReportId };
  "page:render-start": { pageNumber: number };
  "page:render-complete": { page: RenderedPage };
  "page:break": { pageNumber: number; reason: PageBreakReason };
  "element:render-start": { element: RenderedElement };
  "element:render-complete": { element: RenderedElement; result: RenderResult };
  "element:update": { element: RenderedElement; result: UpdateResult };
  "element:destroy": { element: RenderedElement };
  "binding:resolve": { binding: BindingConfig; result: ResolvedBinding };
  "binding:error": { binding: BindingConfig; error: Error };
  "style:compute": { element: RenderedElement; style: ComputedStyle };
  "style:apply": { element: HTMLElement; style: ComputedStyle };
  "plugin:register": { plugin: PluginRegistryEntry };
  "plugin:unregister": { pluginId: PluginId };
  "plugin:event": { event: PluginEvent };
};

/** Event listener type */
export type ReportEventListener<T extends ReportEventType> = (
  event: ReportEventMap[T],
) => void | Promise<void>;

/** Event emitter interface */
export interface ReportEventEmitter {
  on<T extends ReportEventType>(
    type: T,
    listener: ReportEventListener<T>,
  ): () => void;
  off<T extends ReportEventType>(
    type: T,
    listener: ReportEventListener<T>,
  ): void;
  emit<T extends ReportEventType>(
    type: T,
    event: ReportEventMap[T],
  ): Promise<void>;
  once<T extends ReportEventType>(
    type: T,
    listener: ReportEventListener<T>,
  ): () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Deep readonly */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/** Make specific keys required */
export type RequireKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/** Make specific keys optional */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/** Extract element type from config */
export type ElementTypeFromConfig<C extends ElementConfig> = C["type"];

/** Extract plugin ID from config */
export type PluginIdFromConfig<C extends PluginConfig> = C["id"];

/** Type guard for discriminated unions */
export type IsExact<T, U> =
  (<T>() => T extends U ? 1 : 2) extends <U>() => U extends T ? 1 : 2
    ? true
    : false;

// ============================================================================
// Type exports are already available via ES2015 module syntax above
// No namespace export needed - use direct imports instead
// ============================================================================
