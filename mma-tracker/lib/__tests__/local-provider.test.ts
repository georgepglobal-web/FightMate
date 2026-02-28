import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageProvider } from '../local-provider';
import type { LocalUser, DbSession, GroupMember, SparringSession, ShoutboxMessage } from '../data-provider';

function mockLocalStorage() {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
  };
  global.localStorage = mockStorage as Storage;
  return mockStorage;
}

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    mockLocalStorage();
    provider = new LocalStorageProvider();
    vi.clearAllMocks();
  });

  describe('Auth', () => {
    it('getUser() returns null when no user set', () => {
      expect(provider.getUser()).toBeNull();
    });

    it('setUser() stores user and creates a group_members entry', () => {
      const user: LocalUser = { id: 'user1', username: 'testuser' };
      
      provider.setUser(user);
      
      expect(provider.getUser()).toEqual(user);
      const members = provider.getMembers();
      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({
        user_id: 'user1',
        group_id: 'global',
        username: 'testuser',
        score: 0,
        badges: [],
        avatar_level: 'Novice'
      });
    });

    it('setUser() with existing user updates username in members', () => {
      const user1: LocalUser = { id: 'user1', username: 'oldname' };
      const user2: LocalUser = { id: 'user1', username: 'newname' };
      
      provider.setUser(user1);
      provider.setUser(user2);
      
      const members = provider.getMembers();
      expect(members).toHaveLength(1);
      expect(members[0].username).toBe('newname');
    });

    it('signOut() clears user but preserves sessions data', () => {
      const user: LocalUser = { id: 'user1', username: 'testuser' };
      provider.setUser(user);
      provider.addSession({
        user_id: 'user1',
        group_id: 'global',
        date: '2024-01-01',
        type: 'training',
        level: 'beginner',
        points: 10
      });
      
      provider.signOut();
      
      expect(provider.getUser()).toBeNull();
      expect(provider.getSessions('user1')).toHaveLength(1);
    });

    it('setUser() notifies USER and MEMBERS subscribers', () => {
      const userListener = vi.fn();
      const membersListener = vi.fn();
      
      provider.subscribe(provider.KEYS.USER, userListener);
      provider.subscribe(provider.KEYS.MEMBERS, membersListener);
      
      provider.setUser({ id: 'user1', username: 'test' });
      
      expect(userListener).toHaveBeenCalledOnce();
      expect(membersListener).toHaveBeenCalledOnce();
    });
  });

  describe('Sessions', () => {
    it('getSessions() returns empty array for unknown user', () => {
      expect(provider.getSessions('unknown')).toEqual([]);
    });

    it('addSession() creates session with generated id, created_at, updated_at', () => {
      const sessionData = {
        user_id: 'user1',
        group_id: 'global',
        date: '2024-01-01',
        type: 'training',
        level: 'beginner',
        points: 10
      };
      
      const session = provider.addSession(sessionData);
      
      expect(session).toMatchObject(sessionData);
      expect(session.id).toBeDefined();
      expect(session.created_at).toBeDefined();
      expect(session.updated_at).toBeDefined();
    });

    it('addSession() notifies SESSIONS subscribers', () => {
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SESSIONS, listener);
      
      provider.addSession({
        user_id: 'user1',
        group_id: 'global',
        date: '2024-01-01',
        type: 'training',
        level: 'beginner',
        points: 10
      });
      
      expect(listener).toHaveBeenCalledOnce();
    });

    it('getSessions() returns only sessions for the given userId, sorted by date descending', () => {
      provider.addSession({
        user_id: 'user1',
        group_id: 'global',
        date: '2024-01-01',
        type: 'training',
        level: 'beginner',
        points: 10
      });
      provider.addSession({
        user_id: 'user2',
        group_id: 'global',
        date: '2024-01-02',
        type: 'training',
        level: 'beginner',
        points: 15
      });
      provider.addSession({
        user_id: 'user1',
        group_id: 'global',
        date: '2024-01-03',
        type: 'training',
        level: 'beginner',
        points: 20
      });
      
      const user1Sessions = provider.getSessions('user1');
      
      expect(user1Sessions).toHaveLength(2);
      expect(user1Sessions[0].date).toBe('2024-01-03');
      expect(user1Sessions[1].date).toBe('2024-01-01');
    });

    it('deleteSession() removes the session and notifies', () => {
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SESSIONS, listener);
      
      const session = provider.addSession({
        user_id: 'user1',
        group_id: 'global',
        date: '2024-01-01',
        type: 'training',
        level: 'beginner',
        points: 10
      });
      
      provider.deleteSession(session.id);
      
      expect(provider.getSessions('user1')).toHaveLength(0);
      expect(listener).toHaveBeenCalledTimes(2); // once for add, once for delete
    });

    it('deleteSession() with non-existent id does not crash', () => {
      expect(() => provider.deleteSession('nonexistent')).not.toThrow();
    });
  });

  describe('Group Members', () => {
    it('getMembers() returns empty array initially', () => {
      expect(provider.getMembers()).toEqual([]);
    });

    it('upsertMember() inserts new member', () => {
      provider.upsertMember({
        user_id: 'user1',
        group_id: 'global',
        username: 'testuser',
        score: 100
      });
      
      const members = provider.getMembers();
      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({
        user_id: 'user1',
        group_id: 'global',
        username: 'testuser',
        score: 100,
        badges: [],
        avatar_level: 'Novice'
      });
    });

    it('upsertMember() updates existing member matched by user_id + group_id', () => {
      provider.upsertMember({
        user_id: 'user1',
        group_id: 'global',
        username: 'oldname',
        score: 50
      });
      
      provider.upsertMember({
        user_id: 'user1',
        group_id: 'global',
        username: 'newname',
        score: 100
      });
      
      const members = provider.getMembers();
      expect(members).toHaveLength(1);
      expect(members[0].username).toBe('newname');
      expect(members[0].score).toBe(100);
    });

    it('getMemberUsername() returns null for unknown user', () => {
      expect(provider.getMemberUsername('unknown')).toBeNull();
    });

    it('getMemberUsername() returns username after upsert', () => {
      provider.upsertMember({
        user_id: 'user1',
        group_id: 'global',
        username: 'testuser'
      });
      
      expect(provider.getMemberUsername('user1')).toBe('testuser');
    });

    it('isUsernameTaken() returns false when no members', () => {
      expect(provider.isUsernameTaken('anyname')).toBe(false);
    });

    it('isUsernameTaken() returns true for taken name, false with excludeUserId', () => {
      provider.upsertMember({
        user_id: 'user1',
        group_id: 'global',
        username: 'testuser'
      });
      
      expect(provider.isUsernameTaken('testuser')).toBe(true);
      expect(provider.isUsernameTaken('testuser', 'user1')).toBe(false);
      expect(provider.isUsernameTaken('othername')).toBe(false);
    });
  });

  describe('Sparring', () => {
    it('getSparringSessions() returns empty initially', () => {
      expect(provider.getSparringSessions()).toEqual([]);
    });

    it('addSparringSession() creates with id and timestamps', () => {
      const sessionData = {
        creator_id: 'user1',
        date: '2024-01-01',
        time: '18:00',
        location: 'Gym A',
        status: 'open' as const
      };
      
      const session = provider.addSparringSession(sessionData);
      
      expect(session).toMatchObject(sessionData);
      expect(session.id).toBeDefined();
      expect(session.created_at).toBeDefined();
      expect(session.updated_at).toBeDefined();
    });

    it('updateSparringSession() updates fields and updated_at', async () => {
      const session = provider.addSparringSession({
        creator_id: 'user1',
        date: '2024-01-01',
        time: '18:00',
        location: 'Gym A',
        status: 'open'
      });
      
      const originalUpdatedAt = session.updated_at;
      
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      provider.updateSparringSession(session.id, {
        status: 'accepted',
        opponent_id: 'user2'
      });
      
      const sessions = provider.getSparringSessions();
      expect(sessions[0].status).toBe('accepted');
      expect(sessions[0].opponent_id).toBe('user2');
      expect(sessions[0].updated_at).not.toBe(originalUpdatedAt);
    });

    it('updateSparringSession() with non-existent id is a no-op', () => {
      expect(() => provider.updateSparringSession('nonexistent', { status: 'cancelled' })).not.toThrow();
    });

    it('Sessions sorted by date ascending', () => {
      provider.addSparringSession({
        creator_id: 'user1',
        date: '2024-01-03',
        time: '18:00',
        location: 'Gym A',
        status: 'open'
      });
      provider.addSparringSession({
        creator_id: 'user1',
        date: '2024-01-01',
        time: '18:00',
        location: 'Gym B',
        status: 'open'
      });
      
      const sessions = provider.getSparringSessions();
      expect(sessions[0].date).toBe('2024-01-01');
      expect(sessions[1].date).toBe('2024-01-03');
    });
  });

  describe('Shoutbox', () => {
    it('getShoutboxMessages() returns empty initially', () => {
      expect(provider.getShoutboxMessages()).toEqual([]);
    });

    it('addShoutboxMessage() creates with id and created_at', () => {
      const msgData = {
        user_id: 'user1',
        type: 'user' as const,
        content: 'Hello world!'
      };
      
      const message = provider.addShoutboxMessage(msgData);
      
      expect(message).toMatchObject(msgData);
      expect(message.id).toBeDefined();
      expect(message.created_at).toBeDefined();
    });

    it('getShoutboxMessages(limit) respects limit, returns newest first', async () => {
      for (let i = 1; i <= 5; i++) {
        provider.addShoutboxMessage({
          user_id: 'user1',
          type: 'user',
          content: `Message ${i}`
        });
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const messages = provider.getShoutboxMessages(3);
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Message 5');
      expect(messages[2].content).toBe('Message 3');
    });

    it('Notifies SHOUTBOX subscribers on add', () => {
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SHOUTBOX, listener);
      
      provider.addShoutboxMessage({
        user_id: 'user1',
        type: 'user',
        content: 'Test message'
      });
      
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('Subscriptions', () => {
    it('subscribe() returns an unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = provider.subscribe(provider.KEYS.USER, listener);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('Calling unsubscribe stops notifications', () => {
      const listener = vi.fn();
      const unsubscribe = provider.subscribe(provider.KEYS.USER, listener);
      
      provider.setUser({ id: 'user1', username: 'test' });
      expect(listener).toHaveBeenCalledOnce();
      
      unsubscribe();
      provider.setUser({ id: 'user2', username: 'test2' });
      expect(listener).toHaveBeenCalledOnce(); // Still only once
    });

    it('Multiple subscribers on same key all get notified', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      provider.subscribe(provider.KEYS.USER, listener1);
      provider.subscribe(provider.KEYS.USER, listener2);
      
      provider.setUser({ id: 'user1', username: 'test' });
      
      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();
    });

    it('Subscribing to one key does not fire on another key\'s notify', () => {
      const userListener = vi.fn();
      const sessionsListener = vi.fn();
      
      provider.subscribe(provider.KEYS.USER, userListener);
      provider.subscribe(provider.KEYS.SESSIONS, sessionsListener);
      
      provider.setUser({ id: 'user1', username: 'test' });
      
      expect(userListener).toHaveBeenCalledOnce();
      expect(sessionsListener).not.toHaveBeenCalled();
    });
  });
});