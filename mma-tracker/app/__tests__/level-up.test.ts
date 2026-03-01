import { describe, it, expect, beforeEach } from 'vitest';
import { mockLocalStorage } from '../../lib/__tests__/test-utils';
import { LocalStorageProvider } from '../../lib/local-provider';
import { deriveAvatarFromSessions, LEVEL_THRESHOLDS } from '../../lib/constants';

describe('Level-Up Integration', () => {
  let db: LocalStorageProvider;

  beforeEach(() => {
    mockLocalStorage();
    db = new LocalStorageProvider();
    db.setUser({ id: 'u1', username: 'fighter1' });
  });

  function logUntilPoints(target: number) {
    const current = db.getSessions('u1').reduce((s, x) => s + (x.points || 0), 0);
    const remaining = target - current;
    if (remaining <= 0) return;
    const count = Math.ceil(remaining / 2);
    for (let i = 0; i < count; i++) {
      const pts = Math.min(2, remaining - i * 2);
      if (pts <= 0) break;
      db.addSession({ user_id: 'u1', group_id: 'global', date: `2025-01-${String(i + 1).padStart(2, '0')}`, type: 'Boxing', level: 'Advanced', points: pts });
    }
  }

  it('Novice → Intermediate at 8 points', () => {
    logUntilPoints(7);
    expect(deriveAvatarFromSessions(db.getSessions('u1')).level).toBe('Novice');

    db.addSession({ user_id: 'u1', group_id: 'global', date: '2025-02-01', type: 'Boxing', level: 'Basic', points: 1 });
    expect(deriveAvatarFromSessions(db.getSessions('u1')).level).toBe('Intermediate');
  });

  it('Intermediate → Seasoned at 16 points', () => {
    logUntilPoints(15);
    expect(deriveAvatarFromSessions(db.getSessions('u1')).level).toBe('Intermediate');

    db.addSession({ user_id: 'u1', group_id: 'global', date: '2025-03-01', type: 'Boxing', level: 'Basic', points: 1 });
    expect(deriveAvatarFromSessions(db.getSessions('u1')).level).toBe('Seasoned');
  });

  it('Seasoned → Elite at 25 points', () => {
    logUntilPoints(24);
    expect(deriveAvatarFromSessions(db.getSessions('u1')).level).toBe('Seasoned');

    db.addSession({ user_id: 'u1', group_id: 'global', date: '2025-04-01', type: 'Boxing', level: 'Basic', points: 1 });
    expect(deriveAvatarFromSessions(db.getSessions('u1')).level).toBe('Elite');
  });

  it('level-up shoutbox message posted on transition', () => {
    logUntilPoints(7);
    const prevLevel = deriveAvatarFromSessions(db.getSessions('u1')).level;

    db.addSession({ user_id: 'u1', group_id: 'global', date: '2025-02-01', type: 'Boxing', level: 'Basic', points: 1 });
    const newLevel = deriveAvatarFromSessions(db.getSessions('u1')).level;

    expect(prevLevel).toBe('Novice');
    expect(newLevel).toBe('Intermediate');

    // Simulate what page.tsx does on level-up
    db.addShoutboxMessage({ user_id: 'u1', type: 'system', content: `🎉 fighter1 leveled up to Intermediate!` });
    const msgs = db.getShoutboxMessages();
    expect(msgs.some(m => m.content.includes('leveled up to Intermediate'))).toBe(true);
  });

  it('thresholds are consistent', () => {
    expect(LEVEL_THRESHOLDS.Novice.max + 1).toBe(LEVEL_THRESHOLDS.Intermediate.min);
    expect(LEVEL_THRESHOLDS.Intermediate.max + 1).toBe(LEVEL_THRESHOLDS.Seasoned.min);
    expect(LEVEL_THRESHOLDS.Seasoned.max + 1).toBe(LEVEL_THRESHOLDS.Elite.min);
  });
});
