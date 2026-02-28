"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { db, type GroupMember, type DbSession } from "../../lib/data";
import {
  DEFAULT_GROUP_ID,
  calculateLevelFromPoints,
  deriveAvatarFromSessions,
  type Avatar,
  type MemberRanking,
} from "@/lib/constants";
import { calculateWeeklyDiversityBonus, calculateSessionPoints } from "@/lib/points";
import { calculateBadges } from "@/lib/badges";

interface AppContextType {
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  username: string | null;
  setUsername: React.Dispatch<React.SetStateAction<string | null>>;
  authLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  sessions: DbSession[];
  avatar: Avatar;
  currentUserScore: number;
  currentUserBadges: string[];
  groupMembers: MemberRanking[];
  addSession: (session: { date: string; type: string; level: string }) => void;
  deleteSession: (sessionId: string) => void;
  handleSignOut: () => void;
  fetchGroupMembers: () => void;
  handleOnboardingComplete: (newUsername: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  unreadCount: number;
  selectedUserId: string | null;
  setSelectedUserId: React.Dispatch<React.SetStateAction<string | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
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

  const fetchSessions = useCallback(() => {
    if (!userId || authLoading) return;
    setSessions(db.getSessions(userId));
    initialLoadRef.current = true;
  }, [userId, authLoading]);

  const initializeUser = useCallback((uid: string) => {
    if (!uid) return;
    const name = db.getMemberUsername(uid);
    if (name) setUsername(name);
  }, []);

  const upsertCurrentUser = useCallback((score: number, badges: string[], name: string | null) => {
    if (!userId || name === null) return;
    db.upsertMember({
      user_id: userId, group_id: DEFAULT_GROUP_ID, username: name,
      score, badges, avatar_level: calculateLevelFromPoints(score),
    });
  }, [userId]);

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

  useEffect(() => {
    if (!userId || authLoading) return;
    initializeUser(userId);
    db.init?.(userId).then(() => {
      fetchSessions();
      fetchGroupMembers();
    }).catch(() => {
      // Supabase unavailable — local data still works
      fetchSessions();
      fetchGroupMembers();
    });
    return () => { db.destroy?.(); };
  }, [userId, authLoading, initializeUser, fetchGroupMembers]);

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
  const lastShoutboxCountRef = useRef<number | null>(null);
  const isChatOpenRef = useRef(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  useEffect(() => {
    // Seed on mount so we don't count existing messages as unread
    if (lastShoutboxCountRef.current === null) {
      lastShoutboxCountRef.current = db.getShoutboxMessages(30).length;
    }
    const unsub = db.subscribe(db.KEYS.SHOUTBOX, () => {
      const current = db.getShoutboxMessages(30).length;
      const prev = lastShoutboxCountRef.current ?? current;
      const diff = current - prev;
      lastShoutboxCountRef.current = current;
      if (diff > 0 && !isChatOpenRef.current) setUnreadCount((p) => p + diff);
    });
    return unsub;
  }, []); // stable — no deps, uses refs for isChatOpen

  useEffect(() => { if (isChatOpen) setUnreadCount(0); }, [isChatOpen]);

  // Debounced upsert
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
    db.deleteSession(sessionId);
    setSessions((prev) => prev.filter((x) => x.id !== sessionId));
  };

  const handleOnboardingComplete = useCallback((newUsername: string) => {
    setUsername(newUsername);
    setTimeout(fetchGroupMembers, 200);
  }, [fetchGroupMembers]);

  return (
    <AppContext.Provider value={{
      userId, setUserId, username, setUsername, authLoading, setAuthLoading,
      sessions, avatar, currentUserScore, currentUserBadges, groupMembers,
      addSession, deleteSession, handleSignOut, fetchGroupMembers, handleOnboardingComplete,
      isChatOpen, setIsChatOpen, unreadCount, selectedUserId, setSelectedUserId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
