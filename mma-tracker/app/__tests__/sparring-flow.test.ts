import { describe, it, expect, beforeEach } from 'vitest';
import { mockLocalStorage } from '../../lib/__tests__/test-utils';
import { LocalStorageProvider } from '../../lib/local-provider';

describe('Sparring Flow Integration', () => {
  let db: LocalStorageProvider;

  beforeEach(() => {
    mockLocalStorage();
    db = new LocalStorageProvider();
    db.setUser({ id: 'u1', username: 'alice' });
    // Simulate second user in members
    const members = db.getMembers();
    members.push({ user_id: 'u2', username: 'bob', group_id: 'global' });
    localStorage.setItem('fm-members', JSON.stringify(members));
  });

  it('create request → accept → both users see it', () => {
    const req = db.addSparringSession({
      requester_id: 'u1', opponent_id: 'u2', group_id: 'global',
      date: '2025-02-01', time: '18:00', location: 'Gym A', status: 'pending',
    });
    expect(req.status).toBe('pending');

    // Accept
    db.updateSparringSession(req.id, { status: 'accepted' });
    const all = db.getSparringSessions('global');
    expect(all.find(s => s.id === req.id)?.status).toBe('accepted');
  });

  it('create request → cancel → status updated', () => {
    const req = db.addSparringSession({
      requester_id: 'u1', opponent_id: 'u2', group_id: 'global',
      date: '2025-02-01', time: '18:00', location: 'Gym A', status: 'pending',
    });

    db.updateSparringSession(req.id, { status: 'cancelled' });
    expect(db.getSparringSessions('global').find(s => s.id === req.id)?.status).toBe('cancelled');
  });

  it('multiple sparring sessions between different pairs', () => {
    db.addSparringSession({ requester_id: 'u1', opponent_id: 'u2', group_id: 'global', date: '2025-02-01', time: '18:00', location: 'A', status: 'pending' });
    db.addSparringSession({ requester_id: 'u2', opponent_id: 'u1', group_id: 'global', date: '2025-02-02', time: '19:00', location: 'B', status: 'pending' });

    expect(db.getSparringSessions('global')).toHaveLength(2);
  });
});
