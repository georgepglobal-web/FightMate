import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserProfilePage from '../UserProfilePage';
import { mockLocalStorage } from '../../../lib/__tests__/test-utils';
import type { MemberRanking } from '@/lib/constants';

vi.mock('../../../lib/data', () => ({
  db: {
    getSessions: vi.fn().mockReturnValue([
      { id: 's1', user_id: 'u1', group_id: 'global', date: '2025-01-15', type: 'Boxing', level: 'Basic', points: 1.0, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    ]),
    getMembers: vi.fn().mockReturnValue([]),
    getMemberUsername: vi.fn().mockReturnValue(null),
    subscribe: vi.fn().mockReturnValue(() => {}),
    KEYS: { USER: 'fm-user', SESSIONS: 'fm-sessions', MEMBERS: 'fm-members', SPARRING: 'fm-sparring', SHOUTBOX: 'fm-shoutbox' },
  },
}));

const members: MemberRanking[] = [
  { userId: 'u1', name: 'Alice', score: 15, badges: ['Best Striker'], avatarLevel: 'Intermediate' },
];

beforeEach(() => {
  mockLocalStorage();
  vi.clearAllMocks();
});

function renderProfile(selectedUserId: string | null = 'u1', username: string | null = 'Bob') {
  return render(
    
      <UserProfilePage selectedUserId={selectedUserId} groupMembers={members} username={username} />
    
  );
}

describe('UserProfilePage', () => {
  it('renders member name', () => {
    renderProfile();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders avatar level', () => {
    renderProfile();
    expect(screen.getByText('Intermediate Fighter')).toBeInTheDocument();
  });

  it('renders score', () => {
    renderProfile();
    expect(screen.getByText('15.0')).toBeInTheDocument();
  });

  it('renders badges', () => {
    renderProfile();
    expect(screen.getByText('Best Striker')).toBeInTheDocument();
  });

  it('shows anonymous browsing warning when username is null', () => {
    renderProfile('u1', null);
    expect(screen.getByText(/browsing profiles anonymously/)).toBeInTheDocument();
  });

  it('shows Back to Rankings button', () => {
    renderProfile();
    expect(screen.getByText('← Back to Rankings')).toBeInTheDocument();
  });

  it('renders session history section', () => {
    renderProfile();
    expect(screen.getByText('Session History')).toBeInTheDocument();
  });
});
