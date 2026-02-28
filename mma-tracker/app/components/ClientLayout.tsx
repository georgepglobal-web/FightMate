"use client";

import { PageProvider } from "../contexts/PageContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageProvider>
      <main>{children}</main>
    </PageProvider>
  );
}
