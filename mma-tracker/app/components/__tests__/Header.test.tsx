import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

function renderHeader(onSignOut = vi.fn()) {
  return render(<Header onSignOut={onSignOut} />);
}

describe('Header', () => {
  it('renders FightMate brand text', () => {
    renderHeader();
    expect(screen.getByText('FightMate')).toBeInTheDocument();
  });

  it('shows version number', () => {
    renderHeader();
    expect(screen.getByText(/^v/)).toBeInTheDocument();
  });

  it('Sign Out button calls onSignOut', () => {
    const onSignOut = vi.fn();
    renderHeader(onSignOut);
    fireEvent.click(screen.getByLabelText('Sign out'));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

});
