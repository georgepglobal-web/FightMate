"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import GroupRankingPage from "../components/GroupRankingPage";
import RequiresUsernameGate from "../components/RequiresUsernameGate";

export default function RankingRoute() {
  const { groupMembers, userId, username, currentUserScore, currentUserBadges, setSelectedUserId, authLoading } = useApp();
  return (
    <AppShell>
      <RequiresUsernameGate username={username} loading={authLoading}>
        <GroupRankingPage groupMembers={groupMembers} userId={userId} username={username} currentUserScore={currentUserScore} currentUserBadges={currentUserBadges} onSelectUser={setSelectedUserId} />
      </RequiresUsernameGate>
    </AppShell>
  );
}
