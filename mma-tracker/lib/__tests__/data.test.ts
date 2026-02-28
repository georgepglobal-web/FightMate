import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../data';

describe('data.ts factory', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); }
    };
    global.localStorage = mockStorage as Storage;
  });

  it('When NEXT_PUBLIC_DATA_PROVIDER is unset, the exported db has the LocalStorageProvider\'s KEYS', () => {
    expect(db.KEYS).toEqual({
      USER: 'fm-user',
      SESSIONS: 'fm-sessions',
      MEMBERS: 'fm-members',
      SPARRING: 'fm-sparring',
      SHOUTBOX: 'fm-shoutbox'
    });
  });

  it('The db object implements the DataProvider interface (has all expected methods)', () => {
    // Auth methods
    expect(typeof db.getUser).toBe('function');
    expect(typeof db.setUser).toBe('function');
    expect(typeof db.signOut).toBe('function');

    // Sessions methods
    expect(typeof db.getSessions).toBe('function');
    expect(typeof db.addSession).toBe('function');
    expect(typeof db.deleteSession).toBe('function');

    // Group members methods
    expect(typeof db.getMembers).toBe('function');
    expect(typeof db.upsertMember).toBe('function');
    expect(typeof db.getMemberUsername).toBe('function');
    expect(typeof db.isUsernameTaken).toBe('function');

    // Sparring methods
    expect(typeof db.getSparringSessions).toBe('function');
    expect(typeof db.addSparringSession).toBe('function');
    expect(typeof db.updateSparringSession).toBe('function');

    // Shoutbox methods
    expect(typeof db.getShoutboxMessages).toBe('function');
    expect(typeof db.addShoutboxMessage).toBe('function');

    // Subscription method
    expect(typeof db.subscribe).toBe('function');

    // KEYS property
    expect(db.KEYS).toBeDefined();
  });
});