"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import GroupRankingPage from "../components/GroupRankingPage";

export default function RankingRoute() {
  const { groupMembers, userId, username, currentUserScore, currentUserBadges, setSelectedUserId } = useApp();
  return (
    <AppShell>
      <GroupRankingPage groupMembers={groupMembers} userId={userId} username={username} currentUserScore={currentUserScore} currentUserBadges={currentUserBadges} onSelectUser={setSelectedUserId} />
    </AppShell>
  );
}
