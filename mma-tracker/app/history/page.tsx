"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import HistoryPage from "../components/HistoryPage";
import RequiresUsernameGate from "../components/RequiresUsernameGate";

export default function HistoryRoute() {
  const { sessions, deleteSession, username, authLoading } = useApp();
  return (
    <AppShell>
      <RequiresUsernameGate username={username} loading={authLoading}>
        <HistoryPage sessions={sessions} onDelete={deleteSession} />
      </RequiresUsernameGate>
    </AppShell>
  );
}
