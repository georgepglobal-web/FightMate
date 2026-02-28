"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import LogSession from "../components/LogSession";
import RequiresUsernameGate from "../components/RequiresUsernameGate";

export default function LogPage() {
  const { addSession, username, authLoading } = useApp();
  return (
    <AppShell>
      <RequiresUsernameGate username={username} loading={authLoading}>
        <LogSession onAddSession={addSession} />
      </RequiresUsernameGate>
    </AppShell>
  );
}
