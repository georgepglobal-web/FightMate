"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import AvatarEvolutionPage from "../components/AvatarEvolutionPage";
import RequiresUsernameGate from "../components/RequiresUsernameGate";

export default function AvatarRoute() {
  const { avatar, username, authLoading } = useApp();
  return (
    <AppShell>
      <RequiresUsernameGate username={username} loading={authLoading}>
        <AvatarEvolutionPage avatar={avatar} />
      </RequiresUsernameGate>
    </AppShell>
  );
}
