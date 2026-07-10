import type { ReportWorkspacePlugin } from "./plugin-types";

export interface ReportWorkspaceProps {
  htmlReportStream: string;
  reportTitle?: string;
  hint?: string;
  popupMenu?: { trigger: (e: React.MouseEvent) => void };
  plugins?: ReportWorkspacePlugin[];
  onLinkClick?: (type: string, id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}
