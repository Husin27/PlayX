/**
 * Selection Service - Structural abstraction for text, row, and cell coordinate tracking.
 * Clean boilerplate-free vanilla TypeScript core service class.
 * Ready for future plugin integration.
 */

import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "../types/plugin-types";

/**
 * Selection coordinate types for different selection modes.
 */
export interface TextSelection {
  type: "text";
  startOffset: number;
  endOffset: number;
  containerElement: HTMLElement;
  text: string;
}

export interface CellSelection {
  type: "cell";
  rowIndex: number;
  columnIndex: number;
  cellElement: HTMLElement;
  value: string;
}

export interface RowSelection {
  type: "row";
  rowIndex: number;
  rowElement: HTMLElement;
  cells: CellSelection[];
}

export type Selection = TextSelection | CellSelection | RowSelection;

/**
 * Selection change event payload.
 */
export interface SelectionChangeEvent {
  previousSelection: Selection | null;
  currentSelection: Selection | null;
  timestamp: number;
}

/**
 * Selection Service - Centralized selection state management.
 * Provides structural abstraction for text, row, and cell coordinate tracking.
 */
export class SelectionService {
  private currentSelection: Selection | null = null;
  private selectionHistory: Selection[] = [];
  private maxHistorySize = 50;
  private changeListeners: Set<(event: SelectionChangeEvent) => void> =
    new Set();

  /**
   * Get current selection.
   * @returns Current selection or null if none
   */
  public getSelection(): Selection | null {
    return this.currentSelection;
  }

  /**
   * Clear current selection.
   */
  public clearSelection(): void {
    const previous = this.currentSelection;
    this.currentSelection = null;
    this.notifyChange({
      previousSelection: previous,
      currentSelection: null,
      timestamp: Date.now(),
    });
  }

  /**
   * Set text selection.
   * @param selection - Text selection coordinates
   */
  public setTextSelection(selection: TextSelection): void {
    const previous = this.currentSelection;
    this.currentSelection = selection;
    this.addToHistory(selection);
    this.notifyChange({
      previousSelection: previous,
      currentSelection: selection,
      timestamp: Date.now(),
    });
  }

  /**
   * Set cell selection.
   * @param selection - Cell selection coordinates
   */
  public setCellSelection(selection: CellSelection): void {
    const previous = this.currentSelection;
    this.currentSelection = selection;
    this.addToHistory(selection);
    this.notifyChange({
      previousSelection: previous,
      currentSelection: selection,
      timestamp: Date.now(),
    });
  }

  /**
   * Set row selection.
   * @param selection - Row selection coordinates
   */
  public setRowSelection(selection: RowSelection): void {
    const previous = this.currentSelection;
    this.currentSelection = selection;
    this.addToHistory(selection);
    this.notifyChange({
      previousSelection: previous,
      currentSelection: selection,
      timestamp: Date.now(),
    });
  }

  /**
   * Execute copy operation for current selection.
   * @returns Promise resolving to copied text
   */
  public async executeCopy(): Promise<string> {
    if (!this.currentSelection) {
      return "";
    }

    let text = "";

    switch (this.currentSelection.type) {
      case "text":
        text = this.currentSelection.text;
        break;
      case "cell":
        text = this.currentSelection.value;
        break;
      case "row":
        text = this.currentSelection.cells.map((c) => c.value).join("\t");
        break;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for clipboard API failure
      console.warn("Clipboard API unavailable, copy may have failed");
    }

    return text;
  }

  /**
   * Get selection history.
   * @returns Copy of selection history
   */
  public getHistory(): readonly Selection[] {
    return [...this.selectionHistory];
  }

  /**
   * Subscribe to selection changes.
   * @param listener - Change listener callback
   * @returns Unsubscribe function
   */
  public subscribe(
    listener: (event: SelectionChangeEvent) => void,
  ): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Check if there is an active selection.
   * @returns True if selection exists
   */
  public hasSelection(): boolean {
    return this.currentSelection !== null;
  }

  /**
   * Get selection type.
   * @returns Selection type or null
   */
  public getSelectionType(): Selection["type"] | null {
    return this.currentSelection?.type ?? null;
  }

  /**
   * Add selection to history.
   * @param selection - Selection to add
   */
  private addToHistory(selection: Selection): void {
    this.selectionHistory.push(selection);
    if (this.selectionHistory.length > this.maxHistorySize) {
      this.selectionHistory.shift();
    }
  }

  /**
   * Notify all listeners of selection change.
   * @param event - Selection change event
   */
  private notifyChange(event: SelectionChangeEvent): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Selection change listener error:", error);
      }
    }
  }
}

/**
 * Selection Service Factory - Creates configured selection service instances.
 */
export class SelectionServiceFactory {
  /**
   * Create a new selection service instance.
   * @param uiCtx - UI context (optional, for future context-aware selection)
   * @param mutCtx - Mutable context (optional, for future context-aware selection)
   * @returns New SelectionService instance
   */
  public static create(
    _uiCtx?: ReportWorkspaceUIContext,
    _mutCtx?: ReportWorkspaceMutableContext,
  ): SelectionService {
    return new SelectionService();
  }
}
