"use client";

import { AppProvider } from "../contexts/AppContext";
import ErrorBoundary from "./ErrorBoundary";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AppProvider>
        <main>{children}</main>
      </AppProvider>
    </ErrorBoundary>
  );
}
