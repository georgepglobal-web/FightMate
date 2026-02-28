// SQLite-backed DataProvider — calls Next.js API routes, polls for updates

import type { DataProvider, DbSession, GroupMember, ShoutboxMessage, SparringSession, LocalUser } from "./data-provider";

const KEYS = { USER: "user", SESSIONS: "sessions", MEMBERS: "members", SPARRING: "sparring", SHOUTBOX: "shoutbox" } as const;

type Listener = () => void;

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, opts);
  return res.json();
}

function postJson(path: string, body: unknown) {
  return api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export class SqliteProvider implements DataProvider {
  readonly KEYS = KEYS;
  private listeners: Record<string, Set<Listener>> = {};
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private localUser: LocalUser | null = null;

  private notify(key: string) { this.listeners[key]?.forEach((fn) => fn()); }

  subscribe(key: string, fn: Listener): () => void {
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key].add(fn);
    return () => { this.listeners[key]?.delete(fn); };
  }

  async init() {
    // Start polling for shoutbox, members, sparring updates
    this.pollInterval = setInterval(() => {
      this.notify(KEYS.SHOUTBOX);
      this.notify(KEYS.MEMBERS);
      this.notify(KEYS.SPARRING);
    }, 2000);
  }

  destroy() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  // --- Auth (user stored in localStorage for session persistence) ---
  getUser(): LocalUser | null {
    if (this.localUser) return this.localUser;
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("fm-sqlite-user");
    if (raw) this.localUser = JSON.parse(raw);
    return this.localUser;
  }

  setUser(user: LocalUser) {
    this.localUser = user;
    if (typeof window !== "undefined") localStorage.setItem("fm-sqlite-user", JSON.stringify(user));
    postJson("/api/users", user);
    this.notify(KEYS.USER);
  }

  signOut() {
    this.localUser = null;
    if (typeof window !== "undefined") localStorage.removeItem("fm-sqlite-user");
    this.notify(KEYS.USER);
  }

  // --- Sessions ---
  getSessions(userId: string): DbSession[] {
    // Synchronous interface but we need async fetch — return cached, trigger refresh
    this._fetchSessions(userId);
    return this._sessionCache;
  }

  private _sessionCache: DbSession[] = [];
  private _sessionFetching = false;

  private async _fetchSessions(userId: string) {
    if (this._sessionFetching) return;
    this._sessionFetching = true;
    try {
      const rows = await api<DbSession[]>(`/api/sessions?userId=${userId}`);
      this._sessionCache = rows.map((r) => ({ ...r, group_id: "global" }));
      this.notify(KEYS.SESSIONS);
    } finally { this._sessionFetching = false; }
  }

  addSession(session: Omit<DbSession, "id" | "created_at" | "updated_at">): DbSession {
    const temp: DbSession = { ...session, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this._sessionCache = [temp, ...this._sessionCache];
    this.notify(KEYS.SESSIONS);
    postJson("/api/sessions", session).then(() => this._fetchSessions(session.user_id));
    return temp;
  }

  deleteSession(sessionId: string) {
    this._sessionCache = this._sessionCache.filter((s) => s.id !== sessionId);
    this.notify(KEYS.SESSIONS);
    fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE" });
  }

  // --- Members ---
  private _membersCache: GroupMember[] = [];

  getMembers(): GroupMember[] {
    this._fetchMembers();
    return this._membersCache;
  }

  private _membersFetching = false;
  private async _fetchMembers() {
    if (this._membersFetching) return;
    this._membersFetching = true;
    try {
      const rows = await api<GroupMember[]>("/api/members");
      this._membersCache = rows.map((r) => ({ ...r, group_id: "global" }));
    } finally { this._membersFetching = false; }
  }

  upsertMember(member: Partial<GroupMember> & { user_id: string; group_id: string }) {
    const idx = this._membersCache.findIndex((m) => m.user_id === member.user_id);
    const full: GroupMember = { user_id: member.user_id, group_id: "global", username: member.username ?? null, score: member.score ?? 0, badges: member.badges ?? [], updated_at: new Date().toISOString() };
    if (idx >= 0) this._membersCache[idx] = { ...this._membersCache[idx], ...full };
    else this._membersCache.push(full);
    postJson("/api/members", full);
  }

  getMemberUsername(userId: string): string | null {
    return this._membersCache.find((m) => m.user_id === userId)?.username ?? null;
  }

  isUsernameTaken(username: string, excludeUserId?: string): boolean {
    return this._membersCache.some((m) => m.username?.toLowerCase() === username.toLowerCase() && m.user_id !== excludeUserId);
  }

  // --- Sparring ---
  private _sparringCache: SparringSession[] = [];

  getSparringSessions(): SparringSession[] {
    this._fetchSparring();
    return this._sparringCache;
  }

  private _sparringFetching = false;
  private async _fetchSparring() {
    if (this._sparringFetching) return;
    this._sparringFetching = true;
    try { this._sparringCache = await api<SparringSession[]>("/api/sparring"); }
    finally { this._sparringFetching = false; }
  }

  addSparringSession(session: Omit<SparringSession, "id" | "created_at" | "updated_at">): SparringSession {
    const temp: SparringSession = { ...session, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this._sparringCache = [temp, ...this._sparringCache];
    this.notify(KEYS.SPARRING);
    postJson("/api/sparring", session);
    return temp;
  }

  updateSparringSession(id: string, updates: Partial<SparringSession>) {
    const idx = this._sparringCache.findIndex((s) => s.id === id);
    if (idx >= 0) this._sparringCache[idx] = { ...this._sparringCache[idx], ...updates };
    this.notify(KEYS.SPARRING);
    fetch("/api/sparring", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
  }

  // --- Shoutbox ---
  private _shoutboxCache: ShoutboxMessage[] = [];

  getShoutboxMessages(limit = 30): ShoutboxMessage[] {
    this._fetchShoutbox(limit);
    return this._shoutboxCache;
  }

  private _shoutboxFetching = false;
  private async _fetchShoutbox(limit: number) {
    if (this._shoutboxFetching) return;
    this._shoutboxFetching = true;
    try { this._shoutboxCache = await api<ShoutboxMessage[]>(`/api/shoutbox?limit=${limit}`); }
    finally { this._shoutboxFetching = false; }
  }

  addShoutboxMessage(msg: Omit<ShoutboxMessage, "id" | "created_at">): ShoutboxMessage {
    const temp: ShoutboxMessage = { ...msg, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    this._shoutboxCache = [temp, ...this._shoutboxCache];
    this.notify(KEYS.SHOUTBOX);
    postJson("/api/shoutbox", msg);
    return temp;
  }
}
