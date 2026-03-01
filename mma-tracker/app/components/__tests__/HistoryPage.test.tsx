import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryPage from '../HistoryPage';
import type { DbSession } from '@/lib/data-provider';

const makeSessions = (count: number): DbSession[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `s${i}`,
    user_id: 'u1',
    group_id: 'global',
    date: `2025-01-${String(15 - i).padStart(2, '0')}`,
    type: i % 2 === 0 ? 'Boxing' : 'BJJ',
    level: 'Basic',
    points: 1.0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }));

function renderHistory(sessions: DbSession[] = [], onDelete = vi.fn()) {
  return { onDelete, ...render(
    
      <HistoryPage sessions={sessions} onDelete={onDelete} />
    
  )};
}

describe('HistoryPage', () => {
  it('shows empty message when no sessions', () => {
    renderHistory([]);
    expect(screen.getByText('No sessions logged yet.')).toBeInTheDocument();
  });

  it('shows session count in subtitle', () => {
    renderHistory(makeSessions(3));
    expect(screen.getByText('3 sessions logged')).toBeInTheDocument();
  });

  it('shows singular for 1 session', () => {
    renderHistory(makeSessions(1));
    expect(screen.getByText('1 session logged')).toBeInTheDocument();
  });

  it('renders each session type', () => {
    renderHistory(makeSessions(2));
    expect(screen.getByText('Boxing')).toBeInTheDocument();
    expect(screen.getByText('BJJ')).toBeInTheDocument();
  });

  it('renders session level', () => {
    renderHistory(makeSessions(1));
    expect(screen.getByText('Basic')).toBeInTheDocument();
  });

  it('delete button calls onDelete with session id after confirmation', () => {
    const { onDelete } = renderHistory(makeSessions(1));
    fireEvent.click(screen.getByLabelText('Delete session'));
    // ConfirmDialog should appear
    fireEvent.click(screen.getByText('Confirm'));
    expect(onDelete).toHaveBeenCalledWith('s0');
  });
});
