"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import AvatarEvolutionPage from "../components/AvatarEvolutionPage";

export default function AvatarRoute() {
  const { avatar } = useApp();
  return (
    <AppShell>
      <AvatarEvolutionPage avatar={avatar} />
    </AppShell>
  );
}
