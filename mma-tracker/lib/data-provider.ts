// Data provider interface — swap implementations by changing lib/data.ts

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

export interface LocalUser {
  id: string;
  username: string;
}

export interface DataProvider {
  // Lifecycle
  init?(userId: string): Promise<void>;
  destroy?(): void;

  // Auth
  getUser(): LocalUser | null;
  setUser(user: LocalUser): void;
  signOut(): void | Promise<void>;

  // Sessions
  getSessions(userId: string): DbSession[];
  addSession(session: Omit<DbSession, "id" | "created_at" | "updated_at">): DbSession;
  deleteSession(sessionId: string): void;

  // Group members
  getMembers(): GroupMember[];
  upsertMember(member: Partial<GroupMember> & { user_id: string; group_id: string }): void;
  getMemberUsername(userId: string): string | null;
  isUsernameTaken(username: string, excludeUserId?: string): boolean;

  // Sparring
  getSparringSessions(): SparringSession[];
  addSparringSession(session: Omit<SparringSession, "id" | "created_at" | "updated_at">): SparringSession;
  updateSparringSession(id: string, updates: Partial<SparringSession>): void;

  // Shoutbox
  getShoutboxMessages(limit?: number): ShoutboxMessage[];
  addShoutboxMessage(msg: Omit<ShoutboxMessage, "id" | "created_at">): ShoutboxMessage;

  // Subscriptions for reactive updates
  subscribe(key: string, fn: () => void): () => void;

  // Well-known subscription keys
  readonly KEYS: {
    USER: string;
    SESSIONS: string;
    MEMBERS: string;
    SPARRING: string;
    SHOUTBOX: string;
  };
}
