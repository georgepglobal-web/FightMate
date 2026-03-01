import { describe, it, expect, beforeEach } from 'vitest';
import { mockLocalStorage } from '../../lib/__tests__/test-utils';
import { LocalStorageProvider } from '../../lib/local-provider';

describe('Shoutbox Flow Integration', () => {
  let db: LocalStorageProvider;

  beforeEach(() => {
    mockLocalStorage();
    db = new LocalStorageProvider();
    db.setUser({ id: 'u1', username: 'fighter1' });
  });

  it('user and system messages coexist in order', () => {
    db.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'Hello!' });
    db.addShoutboxMessage({ user_id: 'u1', type: 'system', content: 'fighter1 logged Boxing' });
    db.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'Great session!' });

    const msgs = db.getShoutboxMessages();
    expect(msgs).toHaveLength(3);
    expect(msgs[0].type).toBe('user');
    expect(msgs[1].type).toBe('system');
    expect(msgs[2].type).toBe('user');
  });

  it('messages from multiple users', () => {
    db.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'Hey' });
    db.addShoutboxMessage({ user_id: 'u2', type: 'user', content: 'Yo' });

    const msgs = db.getShoutboxMessages();
    expect(msgs).toHaveLength(2);
    expect(msgs.map(m => m.user_id)).toEqual(['u1', 'u2']);
  });

  it('messages have auto-generated id and created_at', () => {
    db.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'test' });
    const msg = db.getShoutboxMessages()[0];
    expect(msg.id).toBeTruthy();
    expect(msg.created_at).toBeTruthy();
  });

  it('getShoutboxMessages respects default limit of 30', () => {
    for (let i = 0; i < 35; i++) {
      db.addShoutboxMessage({ user_id: 'u1', type: 'user', content: `msg-${i}` });
    }
    expect(db.getShoutboxMessages()).toHaveLength(30);
  });

  it('subscription fires on new message via subscribe(key)', () => {
    const received: unknown[] = [];
    db.subscribe('fm-shoutbox', () => received.push(true));

    db.addShoutboxMessage({ user_id: 'u1', type: 'user', content: 'ping' });
    expect(received.length).toBeGreaterThan(0);
  });
});
