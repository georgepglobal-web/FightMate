"use client";

import React from "react";

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-white text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-white/60 text-sm mb-4">{this.state.error.message}</p>
            <button onClick={() => this.setState({ error: null })} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg">Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
