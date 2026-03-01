"use client";

import { useApp } from "./contexts/AppContext";
import AppShell from "./components/AppShell";
import HomePage from "./components/HomePage";

export default function Home() {
  const { avatar, sessions } = useApp();
  return (
    <AppShell>
      <HomePage avatar={avatar} sessions={sessions} />
    </AppShell>
  );
}
