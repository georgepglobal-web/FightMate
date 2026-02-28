"use client";

import { useApp } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import UserProfilePage from "../components/UserProfilePage";

export default function ProfileRoute() {
  const { selectedUserId, groupMembers, username } = useApp();
  return (
    <AppShell>
      <UserProfilePage selectedUserId={selectedUserId} groupMembers={groupMembers} username={username} />
    </AppShell>
  );
}
