import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockLocalStorage } from './test-utils';

// Must define mocks before vi.mock since vi.mock is hoisted
const mockLocalProvider = {
  KEYS: { USER: 'fm-user', SESSIONS: 'fm-sessions', MEMBERS: 'fm-members', SPARRING: 'fm-sparring', SHOUTBOX: 'fm-shoutbox' },
  getUser: vi.fn(),
  setUser: vi.fn(),
  getSessions: vi.fn().mockReturnValue([]),
  addSession: vi.fn(),
  deleteSession: vi.fn(),
  getMembers: vi.fn().mockReturnValue([]),
  upsertMember: vi.fn(),
  getMemberUsername: vi.fn().mockReturnValue(null),
  isUsernameTaken: vi.fn().mockReturnValue(false),
  getSparringSessions: vi.fn().mockReturnValue([]),
  addSparringSession: vi.fn(),
  updateSparringSession: vi.fn(),
  getShoutboxMessages: vi.fn().mockReturnValue([]),
  addShoutboxMessage: vi.fn(),
  signOut: vi.fn(),
  subscribe: vi.fn().mockReturnValue(() => {}),
};

const mockInsert = vi.fn().mockReturnValue(Promise.resolve({ error: null }));
const mockDeleteEq = vi.fn().mockReturnValue(Promise.resolve({ error: null }));
const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });
const mockUpsert = vi.fn().mockReturnValue(Promise.resolve({ error: null }));
const mockUpdateEq = vi.fn().mockReturnValue(Promise.resolve({ error: null }));
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert, delete: mockDelete, upsert: mockUpsert, update: mockUpdate });
const mockSignOut = vi.fn().mockReturnValue(Promise.resolve({ error: null }));

vi.mock('../supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { signOut: (...args: unknown[]) => mockSignOut(...args) },
  },
}));

vi.mock('../local-provider', () => {
  // Must return a constructor that produces mockLocalProvider
  return {
    LocalStorageProvider: class {
      KEYS = mockLocalProvider.KEYS;
      getUser = mockLocalProvider.getUser;
      setUser = mockLocalProvider.setUser;
      getSessions = mockLocalProvider.getSessions;
      addSession = mockLocalProvider.addSession;
      deleteSession = mockLocalProvider.deleteSession;
      getMembers = mockLocalProvider.getMembers;
      upsertMember = mockLocalProvider.upsertMember;
      getMemberUsername = mockLocalProvider.getMemberUsername;
      isUsernameTaken = mockLocalProvider.isUsernameTaken;
      getSparringSessions = mockLocalProvider.getSparringSessions;
      addSparringSession = mockLocalProvider.addSparringSession;
      updateSparringSession = mockLocalProvider.updateSparringSession;
      getShoutboxMessages = mockLocalProvider.getShoutboxMessages;
      addShoutboxMessage = mockLocalProvider.addShoutboxMessage;
      signOut = mockLocalProvider.signOut;
      subscribe = mockLocalProvider.subscribe;
    },
  };
});

describe('SupabaseProvider', () => {
  let provider: InstanceType<typeof import('../supabase-provider').SupabaseProvider>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocalStorage();
    // Re-set default return values after clearAllMocks
    mockInsert.mockReturnValue(Promise.resolve({ error: null }));
    mockDeleteEq.mockReturnValue(Promise.resolve({ error: null }));
    mockDelete.mockReturnValue({ eq: mockDeleteEq });
    mockUpsert.mockReturnValue(Promise.resolve({ error: null }));
    mockUpdateEq.mockReturnValue(Promise.resolve({ error: null }));
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockFrom.mockReturnValue({ insert: mockInsert, delete: mockDelete, upsert: mockUpsert, update: mockUpdate });
    mockSignOut.mockReturnValue(Promise.resolve({ error: null }));
    mockLocalProvider.getSessions.mockReturnValue([]);
    mockLocalProvider.getMembers.mockReturnValue([]);
    mockLocalProvider.getSparringSessions.mockReturnValue([]);
    mockLocalProvider.getShoutboxMessages.mockReturnValue([]);
    mockLocalProvider.getUser.mockReturnValue(null);
    mockLocalProvider.getMemberUsername.mockReturnValue(null);
    mockLocalProvider.isUsernameTaken.mockReturnValue(false);
    mockLocalProvider.subscribe.mockReturnValue(() => {});

    const { SupabaseProvider } = await import('../supabase-provider');
    provider = new SupabaseProvider();
  });

  describe('Read delegation', () => {
    it('getUser() delegates to local', () => {
      const user = { id: 'u1', username: 'fighter' };
      mockLocalProvider.getUser.mockReturnValue(user);
      expect(provider.getUser()).toBe(user);
    });

    it('getSessions() delegates to local', () => {
      const sessions = [{ id: 's1', user_id: 'u1' }];
      mockLocalProvider.getSessions.mockReturnValue(sessions);
      expect(provider.getSessions('u1')).toBe(sessions);
      expect(mockLocalProvider.getSessions).toHaveBeenCalledWith('u1');
    });

    it('getMembers() delegates to local', () => {
      const members = [{ user_id: 'u1', group_id: 'g1' }];
      mockLocalProvider.getMembers.mockReturnValue(members);
      expect(provider.getMembers()).toBe(members);
    });

    it('getSparringSessions() delegates to local', () => {
      const sessions = [{ id: 'sp1' }];
      mockLocalProvider.getSparringSessions.mockReturnValue(sessions);
      expect(provider.getSparringSessions()).toBe(sessions);
    });

    it('getShoutboxMessages() delegates to local', () => {
      const msgs = [{ id: 'm1' }];
      mockLocalProvider.getShoutboxMessages.mockReturnValue(msgs);
      expect(provider.getShoutboxMessages(10)).toBe(msgs);
      expect(mockLocalProvider.getShoutboxMessages).toHaveBeenCalledWith(10);
    });

    it('getMemberUsername() delegates to local', () => {
      mockLocalProvider.getMemberUsername.mockReturnValue('fighter');
      expect(provider.getMemberUsername('u1')).toBe('fighter');
    });

    it('isUsernameTaken() delegates to local', () => {
      mockLocalProvider.isUsernameTaken.mockReturnValue(true);
      expect(provider.isUsernameTaken('fighter', 'u1')).toBe(true);
      expect(mockLocalProvider.isUsernameTaken).toHaveBeenCalledWith('fighter', 'u1');
    });

    it('subscribe() delegates to local', () => {
      const fn = vi.fn();
      provider.subscribe('key', fn);
      expect(mockLocalProvider.subscribe).toHaveBeenCalledWith('key', fn);
    });
  });

  describe('Write operations', () => {
    it('addSession() stores locally AND calls supabase sessions insert', () => {
      const session = { user_id: 'u1', group_id: 'g1', date: '2025-01-01', type: 'Boxing', level: 'Basic', points: 1.0 };
      const created = { ...session, id: 's1', created_at: 'now', updated_at: 'now' };
      mockLocalProvider.addSession.mockReturnValue(created);

      const result = provider.addSession(session);

      expect(mockLocalProvider.addSession).toHaveBeenCalledWith(session);
      expect(mockFrom).toHaveBeenCalledWith('sessions');
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it('deleteSession() removes locally AND calls supabase sessions delete', () => {
      provider.deleteSession('s1');

      expect(mockLocalProvider.deleteSession).toHaveBeenCalledWith('s1');
      expect(mockFrom).toHaveBeenCalledWith('sessions');
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 's1');
    });

    it('upsertMember() stores locally AND calls supabase group_members upsert', () => {
      const member = { user_id: 'u1', group_id: 'g1', username: 'fighter' };
      provider.upsertMember(member);

      expect(mockLocalProvider.upsertMember).toHaveBeenCalledWith(member);
      expect(mockFrom).toHaveBeenCalledWith('group_members');
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('addSparringSession() stores locally AND calls supabase sparring_sessions insert', () => {
      const session = { creator_id: 'u1', date: '2025-01-01', time: '10:00', location: 'Gym', status: 'open' as const };
      const created = { ...session, id: 'sp1', created_at: 'now', updated_at: 'now' };
      mockLocalProvider.addSparringSession.mockReturnValue(created);

      const result = provider.addSparringSession(session);

      expect(mockLocalProvider.addSparringSession).toHaveBeenCalledWith(session);
      expect(mockFrom).toHaveBeenCalledWith('sparring_sessions');
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it('updateSparringSession() updates locally AND calls supabase sparring_sessions update', () => {
      provider.updateSparringSession('sp1', { status: 'accepted' });

      expect(mockLocalProvider.updateSparringSession).toHaveBeenCalledWith('sp1', { status: 'accepted' });
      expect(mockFrom).toHaveBeenCalledWith('sparring_sessions');
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'sp1');
    });

    it('addShoutboxMessage() stores locally AND calls supabase shoutbox_messages insert', () => {
      const msg = { user_id: 'u1', type: 'user' as const, content: 'hello' };
      const created = { ...msg, id: 'm1', created_at: 'now' };
      mockLocalProvider.addShoutboxMessage.mockReturnValue(created);

      const result = provider.addShoutboxMessage(msg);

      expect(mockLocalProvider.addShoutboxMessage).toHaveBeenCalledWith(msg);
      expect(mockFrom).toHaveBeenCalledWith('shoutbox_messages');
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toBe(created);
    });
  });

  describe('Auth', () => {
    it('signOut() calls local signOut AND supabase.auth.signOut()', () => {
      provider.signOut();
      expect(mockLocalProvider.signOut).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('setUser() delegates to local', () => {
      const user = { id: 'u1', username: 'fighter' };
      provider.setUser(user);
      expect(mockLocalProvider.setUser).toHaveBeenCalledWith(user);
    });
  });

  describe('Error handling', () => {
    it('supabase insert failure does not prevent local write from succeeding', () => {
      mockInsert.mockReturnValue(Promise.resolve({ error: { message: 'DB error' } }));
      const session = { user_id: 'u1', group_id: 'g1', date: '2025-01-01', type: 'Boxing', level: 'Basic', points: 1.0 };
      const created = { ...session, id: 's1', created_at: 'now', updated_at: 'now' };
      mockLocalProvider.addSession.mockReturnValue(created);

      const result = provider.addSession(session);
      expect(result).toBe(created);
      expect(mockLocalProvider.addSession).toHaveBeenCalled();
    });
  });

  describe('KEYS', () => {
    it('exposes KEYS from local provider', () => {
      expect(provider.KEYS).toEqual(mockLocalProvider.KEYS);
    });
  });
});
