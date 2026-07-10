import type { ReportWorkspaceState } from "../report-types";

export interface ReportWorkspaceUIContext extends ReportWorkspaceState {
  htmlContent: string;
}

export interface ReportWorkspaceMutableContext {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoFitScale: React.Dispatch<React.SetStateAction<number>>;
  setShowWarningBanner: React.Dispatch<React.SetStateAction<boolean>>;
  triggerAutoFit: () => void;
}
