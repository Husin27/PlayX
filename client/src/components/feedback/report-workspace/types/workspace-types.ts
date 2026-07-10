import type { ReportWorkspacePlugin } from "../report-plugins-core";

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
