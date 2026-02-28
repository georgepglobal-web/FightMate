import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupRankingPage from '../GroupRankingPage';
import type { MemberRanking } from '@/lib/constants';

const members: MemberRanking[] = [
  { userId: 'u1', name: 'Alice', score: 30, badges: ['Best Striker'], avatarLevel: 'Elite', isCurrentUser: false },
  { userId: 'u2', name: 'Bob', score: 20, badges: [], avatarLevel: 'Seasoned', isCurrentUser: true },
  { userId: 'u3', name: 'Charlie', score: 10, badges: ['Best Wrestler'], avatarLevel: 'Intermediate', isCurrentUser: false },
];

function renderRanking(props: Partial<Parameters<typeof GroupRankingPage>[0]> = {}) {
  const onSelectUser = props.onSelectUser ?? vi.fn();
  return { onSelectUser, ...render(
    <GroupRankingPage
      groupMembers={props.groupMembers ?? members}
      userId={props.userId ?? 'u2'}
      username={props.username ?? 'Bob'}
      currentUserScore={props.currentUserScore ?? 20}
      currentUserBadges={props.currentUserBadges ?? []}
      onSelectUser={onSelectUser}
    />
  )};
}

describe('GroupRankingPage', () => {
  it('renders No members found when empty', () => {
    renderRanking({ groupMembers: [], currentUserScore: 0 });
  });

  it('shows member names', () => {
    renderRanking();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('current user highlighted with You badge', () => {
    renderRanking();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('top 3 get medal emojis', () => {
    renderRanking();
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('clicking a member calls onSelectUser', () => {
    const { onSelectUser } = renderRanking();
    fireEvent.click(screen.getByText('Alice'));
    expect(onSelectUser).toHaveBeenCalledWith('u1');
  });

  it('renders badges for members', () => {
    renderRanking();
    expect(screen.getByText('Best Striker')).toBeInTheDocument();
    expect(screen.getByText('Best Wrestler')).toBeInTheDocument();
  });

  it('shows scores', () => {
    renderRanking();
    expect(screen.getByText('30.0 points')).toBeInTheDocument();
    expect(screen.getByText('10.0 points')).toBeInTheDocument();
  });
});
