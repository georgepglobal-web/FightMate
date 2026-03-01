// SQLite-backed DataProvider — uses SSE for shoutbox, fetch-on-mutate for everything else

import type { DataProvider, DbSession, GroupMember, ShoutboxMessage, SparringSession, LocalUser } from "./data-provider";

const KEYS = { USER: "user", SESSIONS: "sessions", MEMBERS: "members", SPARRING: "sparring", SHOUTBOX: "shoutbox" } as const;

type Listener = () => void;

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return [] as unknown as T; }
}

function postJson(path: string, body: unknown) {
  return api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export class SqliteProvider implements DataProvider {
  readonly KEYS = KEYS;
  private listeners: Record<string, Set<Listener>> = {};
  private eventSource: EventSource | null = null;
  private localUser: LocalUser | null = null;
  private _userId: string | null = null;
  private _initialized = false;

  private notify(key: string) { this.listeners[key]?.forEach((fn) => fn()); }

  subscribe(key: string, fn: Listener): () => void {
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key].add(fn);
    return () => { this.listeners[key]?.delete(fn); };
  }

  async init(userId: string) {
    this._userId = userId;
    await Promise.all([
      this._fetchSessions(userId),
      this._fetchShoutbox(30),
      this._fetchMembers(),
      this._fetchSparring(),
    ]);
    this._initialized = true;
    this._connectSSE();
  }

  private _connectSSE() {
    if (typeof EventSource === "undefined") return;
    // Pass the last known message ID so the SSE stream only sends newer messages
    const lastId = this._shoutboxCache.length > 0 ? this._shoutboxCache[0].id : "";
    this.eventSource = new EventSource(`/api/shoutbox/stream?after=${encodeURIComponent(lastId)}`);
    this.eventSource.onmessage = (e) => {
      try {
        const msg: ShoutboxMessage = JSON.parse(e.data);
        if (!this._shoutboxCache.some((m) => m.id === msg.id)) {
          this._shoutboxCache = [msg, ...this._shoutboxCache];
          this.notify(KEYS.SHOUTBOX);
        }
      } catch { /* ignore malformed */ }
    };
  }

  destroy() {
    if (this.eventSource) { this.eventSource.close(); this.eventSource = null; }
  }

  // --- Auth ---
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
  private _sessionCache: DbSession[] = [];
  private _sessionFetching = false;

  getSessions(userId: string): DbSession[] {
    if (!this._initialized) this._fetchSessions(userId);
    return this._sessionCache;
  }

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
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const temp: DbSession = { ...session, id, created_at: now, updated_at: now };
    this._sessionCache = [temp, ...this._sessionCache];
    this.notify(KEYS.SESSIONS);
    postJson("/api/sessions", { ...session, id }).then(() => {
      if (this._userId) this._fetchSessions(this._userId);
    });
    return temp;
  }

  deleteSession(sessionId: string) {
    this._sessionCache = this._sessionCache.filter((s) => s.id !== sessionId);
    this.notify(KEYS.SESSIONS);
    fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE" }).then(() => {
      if (this._userId) this._fetchSessions(this._userId);
    });
  }

  // --- Members ---
  private _membersCache: GroupMember[] = [];
  private _membersRaw: unknown[] = [];
  private _membersFetching = false;

  getMembers(): GroupMember[] {
    if (!this._initialized) this._fetchMembers();
    return this._membersCache;
  }

  private async _fetchMembers() {
    if (this._membersFetching) return;
    this._membersFetching = true;
    try {
      const rows = await api<GroupMember[]>("/api/members");
      this._membersRaw = rows;
      this._membersCache = rows.map((r) => ({ ...r, group_id: "global" }));
      this.notify(KEYS.MEMBERS);
    } finally { this._membersFetching = false; }
  }

  upsertMember(member: Partial<GroupMember> & { user_id: string; group_id: string }) {
    const idx = this._membersCache.findIndex((m) => m.user_id === member.user_id);
    const full: GroupMember = { user_id: member.user_id, group_id: "global", username: member.username ?? null, score: member.score ?? 0, badges: member.badges ?? [], updated_at: new Date().toISOString() };
    if (idx >= 0) this._membersCache[idx] = { ...this._membersCache[idx], ...full };
    else this._membersCache.push(full);
    postJson("/api/members", full).then(() => this._fetchMembers());
  }

  getMemberUsername(userId: string): string | null {
    return this._membersCache.find((m) => m.user_id === userId)?.username ?? null;
  }

  isUsernameTaken(username: string, excludeUserId?: string): boolean {
    return this._membersCache.some((m) => m.username?.toLowerCase() === username.toLowerCase() && m.user_id !== excludeUserId);
  }

  // --- Sparring ---
  private _sparringCache: SparringSession[] = [];
  private _sparringFetching = false;

  getSparringSessions(): SparringSession[] {
    if (!this._initialized) this._fetchSparring();
    return this._sparringCache;
  }

  private async _fetchSparring() {
    if (this._sparringFetching) return;
    this._sparringFetching = true;
    try {
      this._sparringCache = await api<SparringSession[]>("/api/sparring");
      this.notify(KEYS.SPARRING);
    } finally { this._sparringFetching = false; }
  }

  addSparringSession(session: Omit<SparringSession, "id" | "created_at" | "updated_at">): SparringSession {
    const temp: SparringSession = { ...session, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this._sparringCache = [temp, ...this._sparringCache];
    this.notify(KEYS.SPARRING);
    postJson("/api/sparring", session).then(() => this._fetchSparring());
    return temp;
  }

  updateSparringSession(id: string, updates: Partial<SparringSession>) {
    const idx = this._sparringCache.findIndex((s) => s.id === id);
    if (idx >= 0) this._sparringCache[idx] = { ...this._sparringCache[idx], ...updates };
    this.notify(KEYS.SPARRING);
    fetch("/api/sparring", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) }).then(() => this._fetchSparring());
  }

  // --- Shoutbox ---
  private _shoutboxCache: ShoutboxMessage[] = [];
  private _shoutboxFetching = false;

  getShoutboxMessages(limit = 30): ShoutboxMessage[] {
    if (!this._initialized) this._fetchShoutbox(limit);
    return this._shoutboxCache;
  }

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
    postJson("/api/shoutbox", { ...msg, id: temp.id });
    return temp;
  }
}
