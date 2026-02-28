import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockLocalStorage } from '../../../lib/__tests__/test-utils';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    getSparringSessions: vi.fn().mockReturnValue([]),
    addSparringSession: vi.fn(),
    updateSparringSession: vi.fn(),
    addShoutboxMessage: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
    KEYS: { USER: 'fm-user', SESSIONS: 'fm-sessions', MEMBERS: 'fm-members', SPARRING: 'fm-sparring', SHOUTBOX: 'fm-shoutbox' },
  },
}));

vi.mock('../../../lib/data', () => ({ db: mockDb }));

import SparringSessions from '../SparringSessions';

beforeEach(() => {
  mockLocalStorage();
  vi.clearAllMocks();
  mockDb.getSparringSessions.mockReturnValue([]);
  mockDb.subscribe.mockReturnValue(() => {});
});

describe('SparringSessions', () => {
  it('shows warning when username is null', () => {
    render(<SparringSessions userId="u1" username={null} />);
    expect(screen.getByText(/haven't chosen a username/)).toBeInTheDocument();
  });

  it('renders create form', () => {
    render(<SparringSessions userId="u1" username="fighter" />);
    expect(screen.getByLabelText(/Date \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
  });

  it('successful creation calls db.addSparringSession and db.addShoutboxMessage', () => {
    render(<SparringSessions userId="u1" username="fighter" />);
    fireEvent.change(screen.getByLabelText(/Date \*/), { target: { value: '2025-02-01' } });
    fireEvent.change(screen.getByLabelText(/Time \*/), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/Location/), { target: { value: 'Downtown Gym' } });
    fireEvent.submit(screen.getByText('Create Request'));
    expect(mockDb.addSparringSession).toHaveBeenCalledWith(expect.objectContaining({
      creator_id: 'u1', date: '2025-02-01', time: '10:00', location: 'Downtown Gym', status: 'open',
    }));
    expect(mockDb.addShoutboxMessage).toHaveBeenCalled();
  });

  it('shows open sessions from other users with Accept button', () => {
    mockDb.getSparringSessions.mockReturnValue([
      { id: 'sp1', creator_id: 'u2', date: '2025-02-01', time: '10:00', location: 'Gym', status: 'open', created_at: 'now', updated_at: 'now' },
    ]);
    render(<SparringSessions userId="u1" username="fighter" />);
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  it('shows own sessions with Cancel button', () => {
    mockDb.getSparringSessions.mockReturnValue([
      { id: 'sp1', creator_id: 'u1', date: '2025-02-01', time: '10:00', location: 'My Gym', status: 'open', created_at: 'now', updated_at: 'now' },
    ]);
    render(<SparringSessions userId="u1" username="fighter" />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('accept calls db.updateSparringSession with accepted status', () => {
    mockDb.getSparringSessions.mockReturnValue([
      { id: 'sp1', creator_id: 'u2', date: '2025-02-01', time: '10:00', location: 'Gym', status: 'open', created_at: 'now', updated_at: 'now' },
    ]);
    render(<SparringSessions userId="u1" username="fighter" />);
    fireEvent.click(screen.getByText('Accept'));
    expect(mockDb.updateSparringSession).toHaveBeenCalledWith('sp1', { opponent_id: 'u1', status: 'accepted' });
  });

  it('shows accepted sessions in My Upcoming section', () => {
    mockDb.getSparringSessions.mockReturnValue([
      { id: 'sp1', creator_id: 'u1', opponent_id: 'u2', date: '2025-02-01', time: '10:00', location: 'Gym', status: 'accepted', created_at: 'now', updated_at: 'now' },
    ]);
    render(<SparringSessions userId="u1" username="fighter" />);
    expect(screen.getByText('My Upcoming Sparring Sessions')).toBeInTheDocument();
    expect(screen.getByText('✓ Confirmed')).toBeInTheDocument();
  });

  it('shows empty state when no open requests', () => {
    render(<SparringSessions userId="u1" username="fighter" />);
    expect(screen.getByText(/No open sparring requests/)).toBeInTheDocument();
  });
});
