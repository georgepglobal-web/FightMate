"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import LogSession from "../components/LogSession";

export default function LogPage() {
  const { addSession } = useApp();
  return (
    <AppShell>
      <LogSession onAddSession={addSession} />
    </AppShell>
  );
}
