"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePage } from "./contexts/PageContext";
import { db, type GroupMember, type DbSession } from "../lib/data";
import {
  DEFAULT_GROUP_ID,
  calculateLevelFromPoints,
  deriveAvatarFromSessions,
  type Avatar,
  type MemberRanking,
} from "@/lib/constants";
import { calculateWeeklyDiversityBonus, calculateSessionPoints } from "@/lib/points";
import { calculateBadges } from "@/lib/badges";

import AuthGate from "./components/AuthGate";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import LogSession from "./components/LogSession";
import HistoryPage from "./components/HistoryPage";
import AvatarEvolutionPage from "./components/AvatarEvolutionPage";
import GroupRankingPage from "./components/GroupRankingPage";
import UserProfilePage from "./components/UserProfilePage";
import RequiresUsernameGate from "./components/RequiresUsernameGate";
import SparringSessions from "./components/SparringSessions";
import Shoutbox from "./components/Shoutbox";
import ChatFAB from "./components/ChatFAB";

export default function Home() {
  const { currentPage: page } = usePage();

  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<MemberRanking[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAvatarLevelRef = useRef<Avatar["level"] | undefined>(undefined);
  const initialLoadRef = useRef(false);

  const handleSignOut = () => {
    db.signOut();
    if (typeof window !== "undefined") window.location.reload();
  };

  // Fetch sessions
  const fetchSessions = useCallback(() => {
    if (!userId || authLoading) return;
    setSessions(db.getSessions(userId));
    initialLoadRef.current = true;
  }, [userId, authLoading]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Sync username
  const initializeUser = useCallback((uid: string) => {
    if (!uid) return;
    const name = db.getMemberUsername(uid);
    if (name) setUsername(name);
  }, []);

  // Upsert member
  const upsertCurrentUser = useCallback((score: number, badges: string[], name: string | null) => {
    if (!userId || name === null) return;
    db.upsertMember({
      user_id: userId, group_id: DEFAULT_GROUP_ID, username: name,
      score, badges, avatar_level: calculateLevelFromPoints(score),
    });
  }, [userId]);

  // Fetch group members
  const fetchGroupMembers = useCallback(() => {
    if (!userId) return;
    const data = db.getMembers().filter((m) => m.group_id === DEFAULT_GROUP_ID).sort((a, b) => (b.score || 0) - (a.score || 0));
    setGroupMembers(data.map((m: GroupMember) => ({
      userId: m.user_id, name: m.username || (m.user_id === userId ? "You" : "Anonymous Fighter"),
      score: m.score || 0, badges: m.badges || [],
      avatarLevel: m.avatar_level || calculateLevelFromPoints(m.score || 0),
      isCurrentUser: m.user_id === userId,
    })));
  }, [userId]);

  // Init user + group on auth
  useEffect(() => {
    if (!userId || authLoading) return;
    initializeUser(userId);
    fetchGroupMembers();
  }, [userId, authLoading, initializeUser, fetchGroupMembers]);

  // Derived state
  const avatar = useMemo(() => deriveAvatarFromSessions(sessions), [sessions]);

  const currentUserBadges = useMemo(() => calculateBadges(sessions), [sessions]);

  const currentUserScore = avatar.cumulativePoints;

  // Level-up detection
  useEffect(() => {
    if (!userId || sessions.length === 0 || !initialLoadRef.current) return;
    if (prevAvatarLevelRef.current !== undefined && prevAvatarLevelRef.current !== avatar.level) {
      const displayName = username || "Anonymous";
      db.addShoutboxMessage({ user_id: userId, type: "system", content: `${displayName} leveled up to ${avatar.level} 🎉` });
    }
    prevAvatarLevelRef.current = avatar.level;
  }, [avatar.level, avatar.cumulativePoints, userId, username, sessions.length]);

  // Shoutbox unread tracking
  useEffect(() => {
    const unsub = db.subscribe(db.KEYS.SHOUTBOX, () => { if (!isChatOpen) setUnreadCount((p) => p + 1); });
    return unsub;
  }, [isChatOpen]);

  useEffect(() => { if (isChatOpen) setUnreadCount(0); }, [isChatOpen]);

  // Debounced upsert on score/badge change
  useEffect(() => {
    if (!userId) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      upsertCurrentUser(currentUserScore, currentUserBadges, username);
      fetchGroupMembers();
    }, 500);
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [userId, username, currentUserScore, currentUserBadges, upsertCurrentUser, fetchGroupMembers]);

  const addSession = (session: { date: string; type: string; level: string }) => {
    if (!userId) return;
    const diversityBonus = calculateWeeklyDiversityBonus(sessions, session);
    const points = calculateSessionPoints(session.level, diversityBonus);
    const data = db.addSession({ user_id: userId, group_id: DEFAULT_GROUP_ID, ...session, points });
    setSessions((prev) => [data, ...prev]);
    const displayName = username || "Anonymous";
    db.addShoutboxMessage({ user_id: userId, type: "system", content: `${displayName} logged ${session.type} (${session.level}) 🥋` });
  };

  const deleteSession = (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    db.deleteSession(sessionId);
    setSessions((prev) => prev.filter((x) => x.id !== sessionId));
  };

  const handleOnboardingComplete = useCallback((newUsername: string) => {
    setUsername(newUsername);
    setTimeout(fetchGroupMembers, 200);
  }, [fetchGroupMembers]);

  return (
    <AuthGate userId={userId} setUserId={setUserId} authLoading={authLoading} setAuthLoading={setAuthLoading}>
      <>
        <Header onSignOut={handleSignOut} />
        <ChatFAB unreadCount={unreadCount} onClick={() => setIsChatOpen((v) => !v)} />
        {(() => {
          switch (page) {
            case "home": return <HomePage avatar={avatar} sessions={sessions} />;
            case "log": return <RequiresUsernameGate username={username} loading={authLoading}><LogSession onAddSession={addSession} /></RequiresUsernameGate>;
            case "history": return <RequiresUsernameGate username={username} loading={authLoading}><HistoryPage sessions={sessions} onDelete={deleteSession} /></RequiresUsernameGate>;
            case "avatar": return <RequiresUsernameGate username={username} loading={authLoading}><AvatarEvolutionPage avatar={avatar} /></RequiresUsernameGate>;
            case "ranking": return <RequiresUsernameGate username={username} loading={authLoading}><GroupRankingPage groupMembers={groupMembers} userId={userId} username={username} currentUserScore={currentUserScore} currentUserBadges={currentUserBadges} onSelectUser={setSelectedUserId} /></RequiresUsernameGate>;
            case "profile": return <UserProfilePage selectedUserId={selectedUserId} groupMembers={groupMembers} username={username} />;
            case "sparring": return <SparringSessions userId={userId} username={username} />;
            default: return <HomePage avatar={avatar} sessions={sessions} />;
          }
        })()}
        {isChatOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsChatOpen(false)} />
            <div className="relative w-full sm:w-[420px] max-h-[80vh] m-4 sm:m-6 bg-slate-900/95 rounded-t-xl sm:rounded-xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h3 className="text-white font-bold">Chat</h3>
                <button onClick={() => setIsChatOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white px-2 py-1 rounded-md">✕</button>
              </div>
              <div className="h-[64vh] overflow-auto">
                <Shoutbox userId={userId} username={username} />
              </div>
            </div>
          </div>
        )}
      </>
    </AuthGate>
  );
}
