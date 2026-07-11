import { createContext, useContext } from "react";
import { ReportEngine } from "./engines/report-engine";
import type {
  ReportWorkspaceUIContext,
  ReportWorkspaceMutableContext,
} from "./types/plugin-types";

export const EngineContext = createContext<ReportEngine | null>(null);
export const UIContext = createContext<ReportWorkspaceUIContext | null>(null);
export const MutableContext =
  createContext<ReportWorkspaceMutableContext | null>(null);

export const useReportEngine = (): ReportEngine => {
  const ctx = useContext(EngineContext);
  if (!ctx)
    throw new Error("useReportEngine must be used within ReportWorkspace");
  return ctx;
};

export const useReportUI = (): ReportWorkspaceUIContext => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useReportUI must be used within ReportWorkspace");
  return ctx;
};

export const useReportMutable = (): ReportWorkspaceMutableContext => {
  const ctx = useContext(MutableContext);
  if (!ctx)
    throw new Error("useReportMutable must be used within ReportWorkspace");
  return ctx;
};

export const useReportEngineRef = (): ReportEngine => useReportEngine();
