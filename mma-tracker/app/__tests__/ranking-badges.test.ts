import { describe, it, expect, beforeEach } from 'vitest';
import { mockLocalStorage } from '../../lib/__tests__/test-utils';
import { LocalStorageProvider } from '../../lib/local-provider';
import { calculateBadges } from '../../lib/badges';
import { deriveAvatarFromSessions } from '../../lib/constants';

describe('Ranking & Badges Integration', () => {
  let db: LocalStorageProvider;

  beforeEach(() => {
    mockLocalStorage();
    db = new LocalStorageProvider();
  });

  function addUser(id: string, name: string) {
    const members = JSON.parse(localStorage.getItem('fm-members') || '[]');
    members.push({ user_id: id, username: name, group_id: 'global' });
    localStorage.setItem('fm-members', JSON.stringify(members));
  }

  function addSessions(userId: string, entries: { type: string; points: number }[]) {
    entries.forEach((e, i) => {
      db.addSession({ user_id: userId, group_id: 'global', date: `2025-01-${String(i + 1).padStart(2, '0')}`, type: e.type, level: 'Basic', points: e.points });
    });
  }

  it('ranking order by total points', () => {
    addUser('u1', 'alice');
    addUser('u2', 'bob');
    addSessions('u1', [{ type: 'Boxing', points: 2 }]);
    addSessions('u2', [{ type: 'Boxing', points: 5 }, { type: 'BJJ', points: 3 }]);

    const members = db.getMembers();
    const rankings = members.map(m => {
      const sessions = db.getSessions(m.user_id);
      const avatar = deriveAvatarFromSessions(sessions);
      return { name: m.username, score: avatar.cumulativePoints, badges: calculateBadges(sessions) };
    }).sort((a, b) => b.score - a.score);

    expect(rankings[0].name).toBe('bob');
    expect(rankings[0].score).toBe(8);
    expect(rankings[1].name).toBe('alice');
    expect(rankings[1].score).toBe(2);
  });

  it('Best Striker badge for 5+ striking sessions', () => {
    addUser('u1', 'striker');
    addSessions('u1', Array.from({ length: 5 }, () => ({ type: 'Boxing', points: 1 })));
    expect(calculateBadges(db.getSessions('u1'))).toContain('Best Striker');
  });

  it('Best Grappler badge for 5+ grappling sessions', () => {
    addUser('u1', 'grappler');
    addSessions('u1', Array.from({ length: 5 }, () => ({ type: 'BJJ', points: 1 })));
    expect(calculateBadges(db.getSessions('u1'))).toContain('Best Grappler');
  });

  it('Most Balanced badge requires 5+ types and 10+ sessions', () => {
    addUser('u1', 'balanced');
    const types = ['Boxing', 'BJJ', 'Wrestling', 'Judo', 'MMA'];
    addSessions('u1', types.flatMap(t => [{ type: t, points: 1 }, { type: t, points: 1 }]));
    expect(calculateBadges(db.getSessions('u1'))).toContain('Most Balanced');
  });

  it('no badges when insufficient sessions', () => {
    addUser('u1', 'newbie');
    addSessions('u1', [{ type: 'Boxing', points: 1 }]);
    expect(calculateBadges(db.getSessions('u1'))).toEqual([]);
  });
});
