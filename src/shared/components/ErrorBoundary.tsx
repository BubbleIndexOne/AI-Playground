import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-app text-primary flex items-center justify-center p-6 select-none">
          <div className="w-full max-w-md rounded-2xl border border-danger/30 bg-card p-6 shadow-card space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-danger-tint border border-danger/20 flex items-center justify-center mx-auto text-danger">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-[17px] font-semibold text-primary">
                Something went wrong
              </h2>
              <p className="text-[13px] text-secondary">
                An unexpected error interrupted this view. You can reload the page or reset the view.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-app rounded-xl p-3 border border-subtle text-[12px] font-mono text-danger break-words max-h-36 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-medium text-[13px] hover:bg-accent/90 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-subtle bg-app text-primary font-medium text-[13px] hover:bg-raised transition-colors cursor-pointer"
              >
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
