import { describe, it, expect, beforeEach } from 'vitest';
import { mockLocalStorage } from '../../lib/__tests__/test-utils';
import { LocalStorageProvider } from '../../lib/local-provider';
import { calculateWeeklyDiversityBonus, calculateSessionPoints } from '../../lib/points';
import { calculateBadges } from '../../lib/badges';
import { deriveAvatarFromSessions } from '../../lib/constants';

describe('Session Lifecycle Integration', () => {
  let db: LocalStorageProvider;

  beforeEach(() => {
    mockLocalStorage();
    db = new LocalStorageProvider();
  });

  it('full lifecycle: signup → log → diversity bonus → delete → recalc → signout', () => {
    db.setUser({ id: 'u1', username: 'fighter1' });
    expect(db.getUser()).toEqual({ id: 'u1', username: 'fighter1' });
    expect(db.getMembers().find(m => m.user_id === 'u1')).toBeTruthy();

    // Log Boxing Advanced → 2.0 points
    const s1 = db.addSession({ user_id: 'u1', group_id: 'global', date: '2025-01-15', type: 'Boxing', level: 'Advanced', points: 2.0 });
    expect(db.getSessions('u1')).toHaveLength(1);

    // Log BJJ Basic same week → 1.0 + 0.5 diversity = 1.5
    const bonus = calculateWeeklyDiversityBonus(db.getSessions('u1'), { date: '2025-01-16', type: 'BJJ' });
    expect(bonus).toBe(0.5);
    const pts = calculateSessionPoints('Basic', bonus);
    expect(pts).toBe(1.5);
    db.addSession({ user_id: 'u1', group_id: 'global', date: '2025-01-16', type: 'BJJ', level: 'Basic', points: pts });

    // Avatar reflects 3.5 total
    const avatar = deriveAvatarFromSessions(db.getSessions('u1'));
    expect(avatar.cumulativePoints).toBe(3.5);
    expect(avatar.level).toBe('Novice');

    // Delete first session → recalc to 1.5
    db.deleteSession(s1.id);
    expect(db.getSessions('u1')).toHaveLength(1);
    expect(deriveAvatarFromSessions(db.getSessions('u1')).cumulativePoints).toBe(1.5);

    // Sign out preserves data
    db.signOut();
    expect(db.getUser()).toBeNull();
    expect(db.getSessions('u1')).toHaveLength(1);
  });

  it('shoutbox system message on session log', () => {
    db.setUser({ id: 'u1', username: 'fighter1' });
    db.addSession({ user_id: 'u1', group_id: 'global', date: '2025-01-15', type: 'Boxing', level: 'Basic', points: 1.0 });
    db.addShoutboxMessage({ user_id: 'u1', type: 'system', content: 'fighter1 logged Boxing (Basic) 🥋' });

    const msgs = db.getShoutboxMessages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toContain('fighter1 logged Boxing');
  });

  it('diversity bonus caps at 1.5 with 4+ unique types in a week', () => {
    db.setUser({ id: 'u1', username: 'fighter1' });
    const types = ['Boxing', 'BJJ', 'Wrestling', 'Judo', 'MMA'];
    types.forEach((type, i) => {
      const date = `2025-01-${String(13 + i).padStart(2, '0')}`; // Mon-Fri same week
      const bonus = calculateWeeklyDiversityBonus(db.getSessions('u1'), { date, type });
      const pts = calculateSessionPoints('Basic', bonus);
      db.addSession({ user_id: 'u1', group_id: 'global', date, type, level: 'Basic', points: pts });
    });

    // Bonuses: 0, 0.5, 1.0, 1.5, 1.5 (capped) → points: 1, 1.5, 2, 2.5, 2.5 = 9.5
    const total = db.getSessions('u1').reduce((s, x) => s + (x.points || 0), 0);
    expect(total).toBe(9.5);
  });
});
