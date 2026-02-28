import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageProvider } from '../../contexts/PageContext';
import AvatarEvolutionPage from '../AvatarEvolutionPage';
import type { Avatar } from '@/lib/constants';

function renderPage(avatar: Avatar) {
  return render(
    <PageProvider>
      <AvatarEvolutionPage avatar={avatar} />
    </PageProvider>
  );
}

describe('AvatarEvolutionPage', () => {
  it('renders all 4 avatar levels', () => {
    renderPage({ level: 'Novice', progress: 0, cumulativePoints: 0 });
    expect(screen.getByText('Novice')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Seasoned')).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
  });

  it('marks current level', () => {
    renderPage({ level: 'Intermediate', progress: 50, cumulativePoints: 12 });
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('shows correct progress text at 0%', () => {
    renderPage({ level: 'Novice', progress: 0, cumulativePoints: 0 });
    expect(screen.getByText('Getting started')).toBeInTheDocument();
  });

  it('shows correct progress text at 50%', () => {
    renderPage({ level: 'Novice', progress: 50, cumulativePoints: 4 });
    expect(screen.getByText('Halfway there!')).toBeInTheDocument();
  });

  it('shows correct progress text at 75%', () => {
    renderPage({ level: 'Novice', progress: 75, cumulativePoints: 6 });
    expect(screen.getByText('Almost there')).toBeInTheDocument();
  });

  it('shows next level text for non-Elite', () => {
    renderPage({ level: 'Seasoned', progress: 50, cumulativePoints: 20 });
    expect(screen.getByText(/Progress to Elite/)).toBeInTheDocument();
  });

  it('shows Novice Fighter label', () => {
    renderPage({ level: 'Novice', progress: 0, cumulativePoints: 0 });
    expect(screen.getByText('Novice Fighter')).toBeInTheDocument();
  });
});
