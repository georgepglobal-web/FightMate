import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageProvider } from '../../contexts/PageContext';
import HomePage from '../HomePage';
import type { Avatar } from '@/lib/constants';
import type { DbSession } from '@/lib/data-provider';

function renderHome(avatar: Avatar, sessions: DbSession[] = []) {
  return render(
    <PageProvider>
      <HomePage avatar={avatar} sessions={sessions} />
    </PageProvider>
  );
}

const makeSession = (id: string): DbSession => ({
  id, user_id: 'u1', group_id: 'global', date: '2025-01-15',
  type: 'Boxing', level: 'Basic', points: 1.0,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
});

describe('HomePage', () => {
  it('shows session count', () => {
    renderHome({ level: 'Novice', progress: 0, cumulativePoints: 0 }, [makeSession('s1'), makeSession('s2')]);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });

  it('shows current level', () => {
    renderHome({ level: 'Intermediate', progress: 50, cumulativePoints: 12 });
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
  });

  it('shows Novice Fighter badge', () => {
    renderHome({ level: 'Novice', progress: 0, cumulativePoints: 0 });
    expect(screen.getByText('Novice Fighter')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderHome({ level: 'Novice', progress: 0, cumulativePoints: 0 });
    expect(screen.getByText('Log Session')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Avatar Evolution')).toBeInTheDocument();
    expect(screen.getByText('Group Ranking')).toBeInTheDocument();
    expect(screen.getByText('Sparring Sessions')).toBeInTheDocument();
  });

  it('shows Level Progress label', () => {
    renderHome({ level: 'Novice', progress: 25, cumulativePoints: 2 });
    expect(screen.getByText('Level Progress')).toBeInTheDocument();
  });
});
