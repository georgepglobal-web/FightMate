// localStorage-based data store replacing Supabase

export interface GroupMember {
  user_id: string;
  group_id: string;
  username: string | null;
  score: number;
  badges: string[];
  avatar_level?: "Novice" | "Intermediate" | "Seasoned" | "Elite";
  updated_at?: string;
}

export interface SparringSession {
  id: string;
  creator_id: string;
  opponent_id?: string | null;
  date: string;
  time: string;
  location: string;
  notes?: string | null;
  status: "open" | "accepted" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface DbSession {
  id: string;
  user_id: string;
  group_id: string;
  date: string;
  type: string;
  level: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface ShoutboxMessage {
  id: string;
  user_id: string;
  type: "system" | "user";
  content: string;
  created_at: string;
}

const KEYS = {
  USER: "fm-user",
  SESSIONS: "fm-sessions",
  MEMBERS: "fm-members",
  SPARRING: "fm-sparring",
  SHOUTBOX: "fm-shoutbox",
  SETTINGS: "fm-settings",
} as const;

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// Event emitter for real-time-like updates
type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

export function subscribe(key: string, fn: Listener): () => void {
  if (!listeners[key]) listeners[key] = new Set();
  listeners[key].add(fn);
  return () => listeners[key].delete(fn);
}

function notify(key: string) {
  listeners[key]?.forEach((fn) => fn());
}

// --- User ---

export interface LocalUser {
  id: string;
  username: string;
}

export function getUser(): LocalUser | null {
  return get<LocalUser | null>(KEYS.USER, null);
}

export function setUser(user: LocalUser) {
  set(KEYS.USER, user);
  // Also ensure a group_members entry exists
  const members = getMembers();
  const existing = members.find((m) => m.user_id === user.id);
  if (!existing) {
    members.push({
      user_id: user.id,
      group_id: "global",
      username: user.username,
      score: 0,
      badges: [],
      avatar_level: "Novice",
      updated_at: now(),
    });
    set(KEYS.MEMBERS, members);
  } else if (existing.username !== user.username) {
    existing.username = user.username;
    existing.updated_at = now();
    set(KEYS.MEMBERS, members);
  }
  notify(KEYS.USER);
  notify(KEYS.MEMBERS);
}

export function signOut() {
  // Don't delete data, just clear current user
  localStorage.removeItem(KEYS.USER);
  notify(KEYS.USER);
}

// --- Sessions ---

export function getSessions(userId: string): DbSession[] {
  const all = get<DbSession[]>(KEYS.SESSIONS, []);
  return all.filter((s) => s.user_id === userId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getSessionsForUser(userId: string): DbSession[] {
  return getSessions(userId);
}

export function addSession(session: Omit<DbSession, "id" | "created_at" | "updated_at">): DbSession {
  const all = get<DbSession[]>(KEYS.SESSIONS, []);
  const newSession: DbSession = {
    ...session,
    id: uid(),
    created_at: now(),
    updated_at: now(),
  };
  all.push(newSession);
  set(KEYS.SESSIONS, all);
  notify(KEYS.SESSIONS);
  return newSession;
}

export function deleteSession(sessionId: string) {
  const all = get<DbSession[]>(KEYS.SESSIONS, []);
  set(KEYS.SESSIONS, all.filter((s) => s.id !== sessionId));
  notify(KEYS.SESSIONS);
}

// --- Group Members ---

export function getMembers(): GroupMember[] {
  return get<GroupMember[]>(KEYS.MEMBERS, []);
}

export function upsertMember(member: Partial<GroupMember> & { user_id: string; group_id: string }) {
  const members = getMembers();
  const idx = members.findIndex((m) => m.user_id === member.user_id && m.group_id === member.group_id);
  if (idx >= 0) {
    members[idx] = { ...members[idx], ...member, updated_at: now() };
  } else {
    members.push({
      user_id: member.user_id,
      group_id: member.group_id,
      username: member.username ?? null,
      score: member.score ?? 0,
      badges: member.badges ?? [],
      avatar_level: member.avatar_level ?? "Novice",
      updated_at: now(),
    });
  }
  set(KEYS.MEMBERS, members);
  notify(KEYS.MEMBERS);
}

export function getMemberUsername(userId: string): string | null {
  const members = getMembers();
  return members.find((m) => m.user_id === userId)?.username ?? null;
}

export function isUsernameTaken(username: string, excludeUserId?: string): boolean {
  const members = getMembers();
  return members.some((m) => m.username === username && m.user_id !== excludeUserId);
}

// --- Sparring Sessions ---

export function getSparringSessions(): SparringSession[] {
  return get<SparringSession[]>(KEYS.SPARRING, []).sort((a, b) => a.date.localeCompare(b.date));
}

export function addSparringSession(session: Omit<SparringSession, "id" | "created_at" | "updated_at">): SparringSession {
  const all = get<SparringSession[]>(KEYS.SPARRING, []);
  const newSession: SparringSession = { ...session, id: uid(), created_at: now(), updated_at: now() };
  all.push(newSession);
  set(KEYS.SPARRING, all);
  notify(KEYS.SPARRING);
  return newSession;
}

export function updateSparringSession(id: string, updates: Partial<SparringSession>) {
  const all = get<SparringSession[]>(KEYS.SPARRING, []);
  const idx = all.findIndex((s) => s.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updated_at: now() };
    set(KEYS.SPARRING, all);
    notify(KEYS.SPARRING);
  }
}

// --- Shoutbox ---

export function getShoutboxMessages(limit = 30): ShoutboxMessage[] {
  const all = get<ShoutboxMessage[]>(KEYS.SHOUTBOX, []);
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

export function addShoutboxMessage(msg: Omit<ShoutboxMessage, "id" | "created_at">): ShoutboxMessage {
  const all = get<ShoutboxMessage[]>(KEYS.SHOUTBOX, []);
  const newMsg: ShoutboxMessage = { ...msg, id: uid(), created_at: now() };
  all.push(newMsg);
  set(KEYS.SHOUTBOX, all);
  notify(KEYS.SHOUTBOX);
  return newMsg;
}

// Re-export KEYS for subscription
export { KEYS };
