import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  namespace: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onOpenLogs?: (namespace: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component that catches errors in child components
 * and provides a fallback UI with options to view logs
 */
export class ErrorBoundary extends Component<Props, State> {
  private errorLogger: ReturnType<typeof logger.namespace>;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.errorLogger = logger.namespace(props.namespace);
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    this.errorLogger.error(
      `Component error: ${error.message}`,
      {
        componentStack: errorInfo.componentStack,
      },
      error,
    );

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleViewLogs = () => {
    if (this.props.onOpenLogs) {
      this.props.onOpenLogs(this.props.namespace);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex h-full w-full items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>

            <p className="mb-4 text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="mb-4 rounded-md border border-border bg-muted/50 p-3 text-left">
                <summary className="cursor-pointer text-xs font-medium">
                  Error Details
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto text-[10px] text-muted-foreground">
                  {this.state.error?.stack}
                </pre>
                <pre className="mt-2 max-h-32 overflow-auto text-[10px] text-muted-foreground">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>

              {this.props.onOpenLogs && (
                <button
                  onClick={this.handleViewLogs}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <FileText className="h-4 w-4" />
                  View Logs
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
