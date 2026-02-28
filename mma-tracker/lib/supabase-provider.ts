// Supabase implementation of DataProvider
// Reads from localStorage cache, writes to both localStorage and Supabase.
// Call `init()` once on app load to hydrate the cache from Supabase.

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

// Delegate all sync reads to the local provider (acts as cache)
const local = new LocalStorageProvider();

export class SupabaseProvider implements DataProvider {
  readonly KEYS = local.KEYS;

  subscribe(key: string, fn: () => void) { return local.subscribe(key, fn); }

  // --- Auth (Supabase auth + local cache) ---

  getUser(): LocalUser | null { return local.getUser(); }

  setUser(user: LocalUser) {
    local.setUser(user);
    // Supabase auth is handled separately via AuthGate
  }

  signOut() {
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
