import React, { StrictMode, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill Promise.withResolvers for broader browser compatibility (Safari < 17.4, Chrome < 119)
if (typeof Promise !== 'undefined' && !('withResolvers' in Promise)) {
  // @ts-ignore
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0e12] text-zinc-200 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#16171f] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="text-2xl">⚠️</span>
              <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
            </div>
            <p className="text-sm text-zinc-400">
              An unexpected error occurred while rendering the application.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-[#090a0d] p-3 rounded-lg overflow-x-auto text-red-300 font-mono border border-white/5 max-h-40">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
