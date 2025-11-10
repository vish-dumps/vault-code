import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Auto-reload after 3 seconds if error persists
    if (this.state.hasError && !prevState.hasError) {
      console.log('[ErrorBoundary] Error detected, will auto-reload in 3 seconds...');
      setTimeout(() => {
        if (this.state.hasError) {
          console.log('[ErrorBoundary] Auto-reloading application...');
          window.location.reload();
        }
      }, 3000);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Don't reload the entire page, just reset the error state
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                The application encountered an unexpected error. Reloading automatically in 3 seconds...
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
                <p className="text-xs font-mono text-destructive">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
