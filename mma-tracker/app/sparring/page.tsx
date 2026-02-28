"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import SparringSessions from "../components/SparringSessions";

export default function SparringRoute() {
  const { userId, username } = useApp();
  return (
    <AppShell>
      <SparringSessions userId={userId} username={username} />
    </AppShell>
  );
}
