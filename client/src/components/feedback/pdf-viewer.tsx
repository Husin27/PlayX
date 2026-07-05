import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
} from "react";
import { FileText, ShieldAlert, RefreshCw, ExternalLink } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PdfViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  title?: string;
  fallbackText?: string;
  height?: string | number;
}

export const PdfViewer = forwardRef<HTMLDivElement, PdfViewerProps>(
  (
    {
      src,
      title = "PDF Document",
      fallbackText = "Unable to display PDF. Your browser may not support embedded PDFs.",
      height = "600px",
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [iframeSrc, setIframeSrc] = useState<string | undefined>(src);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement, []);

    useEffect(() => {
      if (src !== iframeSrc) {
        setIframeSrc(src);
        setHasError(false);
        setIsLoading(true);
      }
    }, [src, iframeSrc]);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setHasError(false);
    }, []);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
    }, []);

    const handleRetry = useCallback(() => {
      if (iframeRef.current && iframeSrc) {
        setIsLoading(true);
        setHasError(false);
        iframeRef.current.src = iframeSrc;
      }
    }, [iframeSrc]);

    const handleOpenInNewTab = useCallback(() => {
      if (src) {
        window.open(src, "_blank", "noopener,noreferrer");
      }
    }, [src]);

    const containerStyle: React.CSSProperties = {
      height: typeof height === "number" ? `${height}px` : height,
      ...style,
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative",
          "bg-card/90 backdrop-blur-[var(--backdrop-blur)]",
          "border border-[color-mix(in_oklch,var(--color-border)_60%,transparent)]",
          "rounded-surface",
          "overflow-hidden",
          "flex flex-col",
          className,
        )}
        style={containerStyle}
        {...props}
      >
        <div
          className={cn(
            "flex items-center justify-between p-3",
            "bg-[color-mix(in_oklch,var(--color-card)_95%,transparent)]",
            "backdrop-blur-[var(--backdrop-blur)]",
            "border-b border-[color-mix(in_oklch,var(--color-border)_40%,transparent)]",
          )}
          role="toolbar"
          aria-label="PDF viewer controls"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText
              className="w-5 h-5 text-muted-foreground/60 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate">
                {title}
              </h3>
              {src && (
                <p className="text-xs text-muted-foreground/70 truncate max-w-[300px]">
                  {src}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw
                  className="w-4 h-4 animate-spin"
                  aria-hidden="true"
                />
                <span>Loading...</span>
              </div>
            )}
            {hasError && (
              <div className="flex items-center gap-2 text-xs text-destructive/80">
                <ShieldAlert
                  className="w-4 h-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Failed to load</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              disabled={!src}
              className={cn(
                "relative flex items-center justify-center gap-1.5",
                "px-3 py-1.5 rounded-md text-xs font-medium",
                "text-muted-foreground/60 hover:text-foreground",
                "bg-transparent hover:bg-accent",
                "transition-transform duration-100",
                "active:scale-95",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500",
                "disabled:opacity-50 disabled:pointer-events-none",
              )}
              aria-label="Open PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Open</span>
            </button>
            {hasError && (
              <button
                type="button"
                onClick={handleRetry}
                className={cn(
                  "relative flex items-center justify-center",
                  "w-8 h-8 rounded-md",
                  "text-muted-foreground/60 hover:text-foreground",
                  "bg-transparent hover:bg-accent",
                  "transition-transform duration-100",
                  "active:scale-95",
                  "focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500",
                )}
                aria-label="Retry loading PDF"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div
          className="relative flex-1 w-full overflow-hidden"
          style={{ minHeight: 0 }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-card/90">
              <div className="text-center p-8">
                <RefreshCw
                  className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3 animate-spin"
                  aria-hidden="true"
                />
                <p className="text-muted-foreground">Loading document...</p>
              </div>
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 p-8 bg-card/90">
              <div className="text-center max-w-md">
                <ShieldAlert
                  className="w-16 h-16 text-destructive/60 mx-auto mb-4"
                  aria-hidden="true"
                />
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Unable to Display PDF
                </h4>
                <p className="text-sm text-muted-foreground mb-6">
                  {fallbackText}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className={cn(
                      "relative flex items-center justify-center gap-2",
                      "px-4 py-2 rounded-md text-sm font-medium",
                      "bg-brand-primary text-white",
                      "hover:bg-brand-hover",
                      "transition-transform duration-100",
                      "active:scale-95",
                      "focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500",
                    )}
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    disabled={!src}
                    className={cn(
                      "relative flex items-center justify-center gap-2",
                      "px-4 py-2 rounded-md text-sm font-medium",
                      "bg-transparent border border-border",
                      "text-foreground hover:bg-accent",
                      "transition-transform duration-100",
                      "active:scale-95",
                      "focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500",
                      "disabled:opacity-50 disabled:pointer-events-none",
                    )}
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    <span>Open in New Tab</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeSrc ?? ""}
            title={title}
            className={cn(
              "absolute inset-0 w-full h-full border-0",
              "bg-transparent",
              isLoading && "opacity-0",
              hasError && "hidden",
            )}
            sandbox="allow-scripts allow-same-origin"
            allow="fullscreen"
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
          {!iframeSrc && !isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-card/90">
              <div className="text-center">
                <FileText
                  className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4"
                  aria-hidden="true"
                />
                <p className="text-muted-foreground">No PDF source provided</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

PdfViewer.displayName = "PdfViewer";
