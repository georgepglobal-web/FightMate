import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SqliteProvider } from '../sqlite-provider';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

function mockFetchResponse(data: unknown) {
  return Promise.resolve({ text: () => Promise.resolve(JSON.stringify(data)) });
}

function mockLocalStorage() {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  } as Storage;
}

describe('SqliteProvider', () => {
  let provider: SqliteProvider;

  beforeEach(() => {
    vi.useFakeTimers();
    mockLocalStorage();
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/sessions')) return mockFetchResponse([]);
      if (url.includes('/api/shoutbox')) return mockFetchResponse([]);
      if (url.includes('/api/members')) return mockFetchResponse([]);
      if (url.includes('/api/sparring')) return mockFetchResponse([]);
      if (url.includes('/api/users')) return mockFetchResponse({ ok: true });
      return mockFetchResponse([]);
    });
    provider = new SqliteProvider();
  });

  afterEach(() => {
    provider.destroy();
    vi.useRealTimers();
  });

  describe('Auth', () => {
    it('getUser returns null when no user set', () => {
      expect(provider.getUser()).toBeNull();
    });

    it('setUser stores and retrieves user', () => {
      provider.setUser({ id: 'u1', username: 'fighter' });
      expect(provider.getUser()).toEqual({ id: 'u1', username: 'fighter' });
    });

    it('setUser persists to localStorage', () => {
      provider.setUser({ id: 'u1', username: 'fighter' });
      expect(localStorage.getItem('fm-sqlite-user')).toBeTruthy();
      const stored = JSON.parse(localStorage.getItem('fm-sqlite-user')!);
      expect(stored.username).toBe('fighter');
    });

    it('setUser posts to /api/users', () => {
      provider.setUser({ id: 'u1', username: 'fighter' });
      expect(fetchMock).toHaveBeenCalledWith('/api/users', expect.objectContaining({ method: 'POST' }));
    });

    it('setUser notifies USER subscribers', () => {
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.USER, listener);
      provider.setUser({ id: 'u1', username: 'fighter' });
      expect(listener).toHaveBeenCalled();
    });

    it('signOut clears user and notifies', () => {
      provider.setUser({ id: 'u1', username: 'fighter' });
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.USER, listener);
      provider.signOut();
      expect(provider.getUser()).toBeNull();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('init and polling', () => {
    it('init fetches all 4 endpoints', async () => {
      await provider.init('u1');
      const urls = fetchMock.mock.calls.map((c: unknown[]) => c[0] as string);
      expect(urls.some((u: string) => u.includes('/api/sessions'))).toBe(true);
      expect(urls.some((u: string) => u.includes('/api/shoutbox'))).toBe(true);
      expect(urls.some((u: string) => u.includes('/api/members'))).toBe(true);
      expect(urls.some((u: string) => u.includes('/api/sparring'))).toBe(true);
    });

    it('starts polling after init', async () => {
      await provider.init('u1');
      const callsBefore = fetchMock.mock.calls.length;
      await vi.advanceTimersByTimeAsync(2000);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('polls all 4 endpoints each cycle', async () => {
      await provider.init('u1');
      fetchMock.mockClear();
      await vi.advanceTimersByTimeAsync(2000);
      const urls = fetchMock.mock.calls.map((c: unknown[]) => c[0] as string);
      expect(urls.filter((u: string) => u.includes('/api/sessions'))).toHaveLength(1);
      expect(urls.filter((u: string) => u.includes('/api/shoutbox'))).toHaveLength(1);
      expect(urls.filter((u: string) => u.includes('/api/members'))).toHaveLength(1);
      expect(urls.filter((u: string) => u.includes('/api/sparring'))).toHaveLength(1);
    });

    it('destroy stops polling', async () => {
      await provider.init('u1');
      provider.destroy();
      fetchMock.mockClear();
      await vi.advanceTimersByTimeAsync(4000);
      expect(fetchMock.mock.calls.length).toBe(0);
    });
  });

  describe('Sessions', () => {
    it('getSessions returns empty before init', () => {
      expect(provider.getSessions('u1')).toEqual([]);
    });

    it('getSessions returns fetched data after init', async () => {
      const sessions = [{ id: 's1', user_id: 'u1', group_id: 'global', date: '2025-01-01', type: 'Boxing', level: 'Basic', points: 10, created_at: '', updated_at: '' }];
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/sessions')) return mockFetchResponse(sessions);
        return mockFetchResponse([]);
      });
      await provider.init('u1');
      expect(provider.getSessions('u1')).toHaveLength(1);
      expect(provider.getSessions('u1')[0].type).toBe('Boxing');
    });

    it('addSession optimistically adds and notifies', async () => {
      await provider.init('u1');
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SESSIONS, listener);
      const result = provider.addSession({ user_id: 'u1', group_id: 'global', date: '2025-01-01', type: 'BJJ', level: 'Advanced', points: 20 });
      expect(result.type).toBe('BJJ');
      expect(result.id).toBeTruthy();
      expect(provider.getSessions('u1')).toHaveLength(1);
      expect(listener).toHaveBeenCalled();
    });

    it('addSession posts to /api/sessions', async () => {
      await provider.init('u1');
      fetchMock.mockClear();
      provider.addSession({ user_id: 'u1', group_id: 'global', date: '2025-01-01', type: 'BJJ', level: 'Advanced', points: 20 });
      expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ method: 'POST' }));
    });

    it('deleteSession removes and notifies', async () => {
      await provider.init('u1');
      const s = provider.addSession({ user_id: 'u1', group_id: 'global', date: '2025-01-01', type: 'BJJ', level: 'Advanced', points: 20 });
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SESSIONS, listener);
      provider.deleteSession(s.id);
      expect(provider.getSessions('u1')).toHaveLength(0);
      expect(listener).toHaveBeenCalled();
    });

    it('deleteSession calls DELETE /api/sessions', async () => {
      await provider.init('u1');
      const s = provider.addSession({ user_id: 'u1', group_id: 'global', date: '2025-01-01', type: 'BJJ', level: 'Advanced', points: 20 });
      fetchMock.mockClear();
      provider.deleteSession(s.id);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/sessions?id='), expect.objectContaining({ method: 'DELETE' }));
    });

    it('poll notifies SESSIONS when data changes', async () => {
      await provider.init('u1');
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SESSIONS, listener);
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/sessions')) return mockFetchResponse([{ id: 'new', user_id: 'u1', date: '2025-02-01', type: 'Muay Thai', level: 'Basic', points: 5, created_at: '', updated_at: '' }]);
        return mockFetchResponse([]);
      });
      await vi.advanceTimersByTimeAsync(2000);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Members', () => {
    it('getMembers returns empty before init', () => {
      expect(provider.getMembers()).toEqual([]);
    });

    it('getMembers returns fetched data after init', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/members')) return mockFetchResponse([{ user_id: 'u1', group_id: 'global', username: 'fighter', score: 100, badges: [] }]);
        return mockFetchResponse([]);
      });
      await provider.init('u1');
      expect(provider.getMembers()).toHaveLength(1);
    });

    it('upsertMember updates local cache and posts', async () => {
      await provider.init('u1');
      fetchMock.mockClear();
      provider.upsertMember({ user_id: 'u1', group_id: 'global', username: 'newname', score: 50 });
      expect(provider.getMembers()).toHaveLength(1);
      expect(provider.getMemberUsername('u1')).toBe('newname');
      expect(fetchMock).toHaveBeenCalledWith('/api/members', expect.objectContaining({ method: 'POST' }));
    });

    it('upsertMember updates existing member', async () => {
      await provider.init('u1');
      provider.upsertMember({ user_id: 'u1', group_id: 'global', username: 'name1', score: 10 });
      provider.upsertMember({ user_id: 'u1', group_id: 'global', username: 'name2', score: 20 });
      expect(provider.getMembers()).toHaveLength(1);
      expect(provider.getMemberUsername('u1')).toBe('name2');
    });

    it('getMemberUsername returns null for unknown user', () => {
      expect(provider.getMemberUsername('unknown')).toBeNull();
    });

    it('isUsernameTaken works correctly', async () => {
      await provider.init('u1');
      provider.upsertMember({ user_id: 'u1', group_id: 'global', username: 'TakenName', score: 0 });
      expect(provider.isUsernameTaken('takenname')).toBe(true);
      expect(provider.isUsernameTaken('takenname', 'u1')).toBe(false);
      expect(provider.isUsernameTaken('othername')).toBe(false);
    });
  });

  describe('Sparring', () => {
    it('getSparringSessions returns empty before init', () => {
      expect(provider.getSparringSessions()).toEqual([]);
    });

    it('addSparringSession optimistically adds and notifies', async () => {
      await provider.init('u1');
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SPARRING, listener);
      const result = provider.addSparringSession({ creator_id: 'u1', date: '2025-06-01', time: '14:00', location: 'Gym', status: 'open' });
      expect(result.id).toBeTruthy();
      expect(result.location).toBe('Gym');
      expect(provider.getSparringSessions()).toHaveLength(1);
      expect(listener).toHaveBeenCalled();
    });

    it('addSparringSession posts to /api/sparring', async () => {
      await provider.init('u1');
      fetchMock.mockClear();
      provider.addSparringSession({ creator_id: 'u1', date: '2025-06-01', time: '14:00', location: 'Gym', status: 'open' });
      expect(fetchMock).toHaveBeenCalledWith('/api/sparring', expect.objectContaining({ method: 'POST' }));
    });

    it('updateSparringSession updates cache and patches', async () => {
      await provider.init('u1');
      const s = provider.addSparringSession({ creator_id: 'u1', date: '2025-06-01', time: '14:00', location: 'Gym', status: 'open' });
      fetchMock.mockClear();
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SPARRING, listener);
      provider.updateSparringSession(s.id, { status: 'cancelled' });
      expect(provider.getSparringSessions()[0].status).toBe('cancelled');
      expect(listener).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith('/api/sparring', expect.objectContaining({ method: 'PATCH' }));
    });
  });

  describe('Shoutbox', () => {
    it('getShoutboxMessages returns empty before init', () => {
      expect(provider.getShoutboxMessages()).toEqual([]);
    });

    it('addShoutboxMessage optimistically adds and notifies', async () => {
      await provider.init('u1');
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SHOUTBOX, listener);
      const msg = provider.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'Hello!' });
      expect(msg.id).toBeTruthy();
      expect(msg.content).toBe('Hello!');
      expect(provider.getShoutboxMessages()).toHaveLength(1);
      expect(listener).toHaveBeenCalled();
    });

    it('addShoutboxMessage posts to /api/shoutbox', async () => {
      await provider.init('u1');
      fetchMock.mockClear();
      provider.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'Hello!' });
      expect(fetchMock).toHaveBeenCalledWith('/api/shoutbox', expect.objectContaining({ method: 'POST' }));
    });

    it('poll notifies SHOUTBOX when new messages arrive', async () => {
      await provider.init('u1');
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SHOUTBOX, listener);
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/shoutbox')) return mockFetchResponse([{ id: 'ext1', user_id: 'u2', type: 'user', content: 'Hey', created_at: new Date().toISOString() }]);
        return mockFetchResponse([]);
      });
      await vi.advanceTimersByTimeAsync(2000);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Subscriptions', () => {
    it('subscribe returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = provider.subscribe(provider.KEYS.SHOUTBOX, listener);
      provider.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'test' });
      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
      provider.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'test2' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('multiple subscribers all get notified', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      provider.subscribe(provider.KEYS.SHOUTBOX, l1);
      provider.subscribe(provider.KEYS.SHOUTBOX, l2);
      provider.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'test' });
      expect(l1).toHaveBeenCalled();
      expect(l2).toHaveBeenCalled();
    });

    it('poll does not notify when data has not changed', async () => {
      await provider.init('u1');
      const listener = vi.fn();
      provider.subscribe(provider.KEYS.SESSIONS, listener);
      provider.subscribe(provider.KEYS.SHOUTBOX, listener);
      provider.subscribe(provider.KEYS.MEMBERS, listener);
      provider.subscribe(provider.KEYS.SPARRING, listener);
      // Poll returns same empty data as init
      await vi.advanceTimersByTimeAsync(2000);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
