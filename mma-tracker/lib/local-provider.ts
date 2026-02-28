// localStorage implementation of DataProvider

import type {
  DataProvider,
  GroupMember,
  SparringSession,
  DbSession,
  ShoutboxMessage,
  LocalUser,
} from "./data-provider";

const KEYS = {
  USER: "fm-user",
  SESSIONS: "fm-sessions",
  MEMBERS: "fm-members",
  SPARRING: "fm-sparring",
  SHOUTBOX: "fm-shoutbox",
} as const;

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function set(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string { return crypto.randomUUID(); }
function now(): string { return new Date().toISOString(); }

type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

function notify(key: string) { listeners[key]?.forEach((fn) => fn()); }

export class LocalStorageProvider implements DataProvider {
  readonly KEYS = KEYS;

  subscribe(key: string, fn: Listener): () => void {
    if (!listeners[key]) listeners[key] = new Set();
    listeners[key].add(fn);
    return () => { listeners[key].delete(fn); };
  }

  // --- Auth ---
  getUser(): LocalUser | null { return get<LocalUser | null>(KEYS.USER, null); }

  setUser(user: LocalUser) {
    set(KEYS.USER, user);
    const members = this.getMembers();
    const existing = members.find((m) => m.user_id === user.id);
    if (!existing) {
      members.push({ user_id: user.id, group_id: "global", username: user.username, score: 0, badges: [], avatar_level: "Novice", updated_at: now() });
      set(KEYS.MEMBERS, members);
    } else if (existing.username !== user.username) {
      existing.username = user.username;
      existing.updated_at = now();
      set(KEYS.MEMBERS, members);
    }
    notify(KEYS.USER);
    notify(KEYS.MEMBERS);
  }

  signOut() {
    localStorage.removeItem(KEYS.USER);
    notify(KEYS.USER);
  }

  // --- Sessions ---
  getSessions(userId: string): DbSession[] {
    return get<DbSession[]>(KEYS.SESSIONS, [])
      .filter((s) => s.user_id === userId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  addSession(session: Omit<DbSession, "id" | "created_at" | "updated_at">): DbSession {
    const all = get<DbSession[]>(KEYS.SESSIONS, []);
    const s: DbSession = { ...session, id: uid(), created_at: now(), updated_at: now() };
    all.push(s);
    set(KEYS.SESSIONS, all);
    notify(KEYS.SESSIONS);
    return s;
  }

  deleteSession(sessionId: string) {
    set(KEYS.SESSIONS, get<DbSession[]>(KEYS.SESSIONS, []).filter((s) => s.id !== sessionId));
    notify(KEYS.SESSIONS);
  }

  // --- Group Members ---
  getMembers(): GroupMember[] { return get<GroupMember[]>(KEYS.MEMBERS, []); }

  upsertMember(member: Partial<GroupMember> & { user_id: string; group_id: string }) {
    const members = this.getMembers();
    const idx = members.findIndex((m) => m.user_id === member.user_id && m.group_id === member.group_id);
    if (idx >= 0) {
      members[idx] = { ...members[idx], ...member, updated_at: now() };
    } else {
      members.push({
        user_id: member.user_id, group_id: member.group_id,
        username: member.username ?? null, score: member.score ?? 0,
        badges: member.badges ?? [], avatar_level: member.avatar_level ?? "Novice",
        updated_at: now(),
      });
    }
    set(KEYS.MEMBERS, members);
    notify(KEYS.MEMBERS);
  }

  getMemberUsername(userId: string): string | null {
    return this.getMembers().find((m) => m.user_id === userId)?.username ?? null;
  }

  isUsernameTaken(username: string, excludeUserId?: string): boolean {
    return this.getMembers().some((m) => m.username === username && m.user_id !== excludeUserId);
  }

  // --- Sparring ---
  getSparringSessions(): SparringSession[] {
    return get<SparringSession[]>(KEYS.SPARRING, []).sort((a, b) => a.date.localeCompare(b.date));
  }

  addSparringSession(session: Omit<SparringSession, "id" | "created_at" | "updated_at">): SparringSession {
    const all = get<SparringSession[]>(KEYS.SPARRING, []);
    const s: SparringSession = { ...session, id: uid(), created_at: now(), updated_at: now() };
    all.push(s);
    set(KEYS.SPARRING, all);
    notify(KEYS.SPARRING);
    return s;
  }

  updateSparringSession(id: string, updates: Partial<SparringSession>) {
    const all = get<SparringSession[]>(KEYS.SPARRING, []);
    const idx = all.findIndex((s) => s.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates, updated_at: now() };
      set(KEYS.SPARRING, all);
      notify(KEYS.SPARRING);
    }
  }

  // --- Shoutbox ---
  getShoutboxMessages(limit = 30): ShoutboxMessage[] {
    return get<ShoutboxMessage[]>(KEYS.SHOUTBOX, [])
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  addShoutboxMessage(msg: Omit<ShoutboxMessage, "id" | "created_at">): ShoutboxMessage {
    const all = get<ShoutboxMessage[]>(KEYS.SHOUTBOX, []);
    const m: ShoutboxMessage = { ...msg, id: uid(), created_at: now() };
    all.push(m);
    set(KEYS.SHOUTBOX, all);
    notify(KEYS.SHOUTBOX);
    return m;
  }
}
