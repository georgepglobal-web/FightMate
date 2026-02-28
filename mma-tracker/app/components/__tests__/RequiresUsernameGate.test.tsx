import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageProvider } from '../../contexts/PageContext';
import RequiresUsernameGate from '../RequiresUsernameGate';

function renderGate(username: string | null, loading = false) {
  return render(
    <PageProvider>
      <RequiresUsernameGate username={username} loading={loading}>
        <div data-testid="child">Protected content</div>
      </RequiresUsernameGate>
    </PageProvider>
  );
}

describe('RequiresUsernameGate', () => {
  it('shows loading spinner when loading is true', () => {
    renderGate(null, true);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('shows Username Required when not loading and username is null', () => {
    renderGate(null, false);
    expect(screen.getByText('Username Required')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders children when username is set', () => {
    renderGate('fighter', false);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByText('Username Required')).not.toBeInTheDocument();
  });

  it('shows Back to Home button when username is null', () => {
    renderGate(null, false);
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });
});
