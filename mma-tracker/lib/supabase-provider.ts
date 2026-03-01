// Supabase implementation of DataProvider
// Reads from localStorage cache, writes to both localStorage and Supabase.
// Call `init(userId)` once after auth to hydrate the cache from Supabase.

import { supabase } from "./supabase";
import { LocalStorageProvider } from "./local-provider";
import type {
  DataProvider,
  DbSession,
  GroupMember,
  SparringSession,
  ShoutboxMessage,
  LocalUser,
} from "./data-provider";
import type { RealtimeChannel } from "@supabase/supabase-js";

const local = new LocalStorageProvider();

export class SupabaseProvider implements DataProvider {
  readonly KEYS = local.KEYS;
  private channel: RealtimeChannel | null = null;

  subscribe(key: string, fn: () => void) { return local.subscribe(key, fn); }

  // --- Lifecycle ---

  async init(userId: string) {
    const [sessions, members, shoutbox, sparring] = await Promise.all([
      supabase.from("sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("group_members").select("*"),
      supabase.from("shoutbox_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("sparring_sessions").select("*").order("created_at", { ascending: false }),
    ]);

    if (sessions.data) local.hydrate(this.KEYS.SESSIONS, sessions.data);
    if (members.data) local.hydrate(this.KEYS.MEMBERS, members.data);
    if (shoutbox.data) local.hydrate(this.KEYS.SHOUTBOX, shoutbox.data);
    if (sparring.data) local.hydrate(this.KEYS.SPARRING, sparring.data);

    // Realtime subscriptions
    this.channel = supabase.channel("app-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shoutbox_messages" }, (payload) => {
        local.mergeRecord(this.KEYS.SHOUTBOX, payload.new as ShoutboxMessage);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, (payload) => {
        local.mergeRecord(this.KEYS.MEMBERS, payload.new as GroupMember, "user_id");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sparring_sessions" }, (payload) => {
        local.mergeRecord(this.KEYS.SPARRING, payload.new as SparringSession);
      })
      .subscribe();
  }

  destroy() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // --- Auth ---

  getUser(): LocalUser | null { return local.getUser(); }

  setUser(user: LocalUser) { local.setUser(user); }

  signOut() {
    this.destroy();
    local.signOut();
    supabase.auth.signOut().catch(() => {});
  }

  // --- Sessions ---

  getSessions(userId: string): DbSession[] { return local.getSessions(userId); }

  addSession(session: Omit<DbSession, "id" | "created_at" | "updated_at">): DbSession {
    const created = local.addSession(session);
    supabase.from("sessions").insert({
      user_id: session.user_id, group_id: session.group_id,
      date: session.date, type: session.type, level: session.level, points: session.points,
    }).then(({ error }) => { if (error) console.error("[SupabaseProvider] addSession error:", error); });
    return created;
  }

  deleteSession(sessionId: string) {
    local.deleteSession(sessionId);
    supabase.from("sessions").delete().eq("id", sessionId)
      .then(({ error }) => { if (error) console.error("[SupabaseProvider] deleteSession error:", error); });
  }

  // --- Group Members ---

  getMembers(): GroupMember[] { return local.getMembers(); }

  upsertMember(member: Partial<GroupMember> & { user_id: string; group_id: string }) {
    local.upsertMember(member);
    supabase.from("group_members").upsert({ ...member, updated_at: new Date().toISOString() }, { onConflict: "user_id,group_id" })
      .then(({ error }) => { if (error) console.error("[SupabaseProvider] upsertMember error:", error); });
  }

  getMemberUsername(userId: string): string | null { return local.getMemberUsername(userId); }
  isUsernameTaken(username: string, excludeUserId?: string): boolean { return local.isUsernameTaken(username, excludeUserId); }

  // --- Sparring ---

  getSparringSessions(): SparringSession[] { return local.getSparringSessions(); }

  addSparringSession(session: Omit<SparringSession, "id" | "created_at" | "updated_at">): SparringSession {
    const created = local.addSparringSession(session);
    supabase.from("sparring_sessions").insert(session)
      .then(({ error }) => { if (error) console.error("[SupabaseProvider] addSparringSession error:", error); });
    return created;
  }

  updateSparringSession(id: string, updates: Partial<SparringSession>) {
    local.updateSparringSession(id, updates);
    supabase.from("sparring_sessions").update(updates).eq("id", id)
      .then(({ error }) => { if (error) console.error("[SupabaseProvider] updateSparringSession error:", error); });
  }

  // --- Shoutbox ---

  getShoutboxMessages(limit = 30): ShoutboxMessage[] { return local.getShoutboxMessages(limit); }

  addShoutboxMessage(msg: Omit<ShoutboxMessage, "id" | "created_at">): ShoutboxMessage {
    const created = local.addShoutboxMessage(msg);
    supabase.from("shoutbox_messages").insert(msg)
      .then(({ error }) => { if (error) console.error("[SupabaseProvider] addShoutboxMessage error:", error); });
    return created;
  }
}
