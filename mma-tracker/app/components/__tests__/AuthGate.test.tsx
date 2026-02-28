import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AuthGate from '../AuthGate';
import { mockLocalStorage } from '../../../lib/__tests__/test-utils';

vi.mock('../../../lib/data', () => {
  const mockDb = {
    getUser: vi.fn().mockReturnValue(null),
    setUser: vi.fn(),
    signOut: vi.fn(),
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
    subscribe: vi.fn().mockReturnValue(() => {}),
    KEYS: { USER: 'fm-user', SESSIONS: 'fm-sessions', MEMBERS: 'fm-members', SPARRING: 'fm-sparring', SHOUTBOX: 'fm-shoutbox' },
  };
  return { db: mockDb };
});

beforeEach(() => {
  mockLocalStorage();
  vi.clearAllMocks();
});

describe('AuthGate', () => {
  it('shows loading state initially', () => {
    render(
      <AuthGate userId="" setUserId={vi.fn()} authLoading={true} setAuthLoading={vi.fn()}>
        <div>Protected</div>
      </AuthGate>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('shows LoginScreen when no user and not loading', () => {
    render(
      <AuthGate userId="" setUserId={vi.fn()} authLoading={false} setAuthLoading={vi.fn()}>
        <div>Protected</div>
      </AuthGate>
    );
    expect(screen.getByText(/Welcome to FightMate/)).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders children when userId is set and not loading', () => {
    render(
      <AuthGate userId="u1" setUserId={vi.fn()} authLoading={false} setAuthLoading={vi.fn()}>
        <div>Protected</div>
      </AuthGate>
    );
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('calls setAuthLoading(false) after checking user', () => {
    const setAuthLoading = vi.fn();
    render(
      <AuthGate userId="" setUserId={vi.fn()} authLoading={true} setAuthLoading={setAuthLoading}>
        <div>Protected</div>
      </AuthGate>
    );
    expect(setAuthLoading).toHaveBeenCalledWith(false);
  });
});
