import type { ReportWorkspacePlugin } from "./plugin-types";
import type { PageNumberingConfig } from "../services/page-numbering-service";

export interface ReportWorkspaceProps {
  htmlReportStream: string;
  reportTitle?: string;
  hint?: string;
  popupMenu?: { trigger: (e: React.MouseEvent) => void };
  plugins?: ReportWorkspacePlugin[];
  onLinkClick?: (type: string, id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Page numbering configuration */
  pageNumbering?: PageNumberingConfig;
}
