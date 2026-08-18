'use client';

import { Component } from 'react';

/**
 * ErrorBoundary — Catches unhandled render errors in the component tree
 * and displays a graceful fallback UI instead of crashing the entire app.
 *
 * Wraps the main application content in `layout.js` to ensure any page-level
 * render failure is contained and recoverable.
 *
 * @extends {Component<{children: React.ReactNode}, {hasError: boolean, error: Error|null}>}
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Resets the error state so the user can retry rendering the failed component.
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-[60vh] flex items-center justify-center p-8"
        >
          <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-red-500/30 p-8 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              An unexpected error occurred while rendering this section. Your
              data is safe — click below to retry.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono text-red-400/80 bg-slate-950 p-3 rounded-lg border border-slate-800 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition active:scale-95"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
