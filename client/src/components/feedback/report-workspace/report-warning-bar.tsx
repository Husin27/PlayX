import React from "react";
import { cn } from "@/lib/utils";
import { useReportUI } from "./report-context";

export const ReportWarningBar: React.FC = () => {
  const { showWarningBanner } = useReportUI();

  if (!showWarningBanner) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg",
        "bg-amber-100 border border-amber-300 text-amber-800",
        "animate-slide-up",
      )}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠</span>
        <span className="text-sm font-medium">
          Auto-fit could not fit content perfectly. Some content may be clipped.
        </span>
      </div>
    </div>
  );
};

export default ReportWarningBar;
