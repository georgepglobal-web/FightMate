"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import HistoryPage from "../components/HistoryPage";

export default function HistoryRoute() {
  const { sessions, deleteSession } = useApp();
  return (
    <AppShell>
      <HistoryPage sessions={sessions} onDelete={deleteSession} />
    </AppShell>
  );
}
