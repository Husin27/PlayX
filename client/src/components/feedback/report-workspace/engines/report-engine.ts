import { DOMEngineImpl, createDOMEngine } from "./dom-engine";
import { RenderEngine } from "./render-engine";
import { AutoFitEngine } from "./autofit-engine";
import { HyperlinkEngine } from "./hyperlink-engine";
import { GroupEngine } from "./group-engine";
import { TooltipEngine } from "./tooltip-engine";
import { ContextMenuEngine } from "./contextmenu-engine";
import { ActionRegistry } from "../services/action-registry";
import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "../types/plugin-types";

export class ReportEngine {
  /**
   * 🔒 STRICT IMMUTABILITY SHIELD [v3.3]
   * All sub-engines are deeply frozen as compile-time read-only instances
   * to guarantee zero architectural drift during runtime execution.
   */
  public readonly dom: DOMEngineImpl = createDOMEngine();
  public readonly render: RenderEngine = new RenderEngine();
  public readonly autoFit: AutoFitEngine = new AutoFitEngine();
  public readonly hyperlink: HyperlinkEngine = new HyperlinkEngine();
  public readonly group: GroupEngine = new GroupEngine();
  public readonly tooltip: TooltipEngine = new TooltipEngine();
  public readonly contextMenu: ContextMenuEngine = new ContextMenuEngine({
    uiCtx: {} as ReportWorkspaceUIContext,
    mutCtx: {} as ReportWorkspaceMutableContext,
    plugins: [],
    coreRegistry: new ActionRegistry(),
  });

  public mount(container: HTMLDivElement): void {
    this.dom.setContainer(container);
  }

  public unmount(): void {
    this.hyperlink.unbind(this.dom);
    this.group.unbind(this.dom);
    this.tooltip.detach();
    this.dom.setContainer(null);
  }

  public runAutoFitSequence(
    applyScaleCallback: (scale: number) => void,
  ): boolean {
    return this.autoFit.runSession(this.dom, applyScaleCallback);
  }

  public bindCoreListeners(
    onLinkClick?: (type: string, id: string) => void,
  ): void {
    if (onLinkClick) this.hyperlink.bind(this.dom, onLinkClick);
    this.group.bind(this.dom);
  }

  public resolveContextMenuPipeline(
    target: HTMLElement,
  ): Record<string, () => void> {
    return this.contextMenu.buildPipeline(target);
  }
}
