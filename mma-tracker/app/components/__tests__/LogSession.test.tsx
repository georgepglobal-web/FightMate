import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageProvider } from '../../contexts/PageContext';
import LogSession from '../LogSession';

function renderLogSession(onAddSession = vi.fn()) {
  return { onAddSession, ...render(
    <PageProvider>
      <LogSession onAddSession={onAddSession} />
    </PageProvider>
  )};
}

describe('LogSession', () => {
  it('renders date, type, and level inputs', () => {
    renderLogSession();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Session Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Class Level')).toBeInTheDocument();
  });

  it('has all session types in dropdown', () => {
    renderLogSession();
    const select = screen.getByLabelText('Session Type');
    expect(select.querySelectorAll('option').length).toBeGreaterThanOrEqual(10);
    expect(screen.getByText('Boxing')).toBeInTheDocument();
    expect(screen.getByText('BJJ')).toBeInTheDocument();
    expect(screen.getByText('MMA')).toBeInTheDocument();
  });

  it('has all class levels in dropdown', () => {
    renderLogSession();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('All Level')).toBeInTheDocument();
  });

  it('successful submit calls onAddSession with { date, type, level }', () => {
    const { onAddSession } = renderLogSession();
    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    fireEvent.submit(screen.getByRole('button', { name: /Log Session/i }));
    expect(onAddSession).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2025-01-15', type: 'Boxing', level: 'Basic' })
    );
    // Should NOT include points or group_id
    const arg = onAddSession.mock.calls[0][0];
    expect(arg).not.toHaveProperty('points');
    expect(arg).not.toHaveProperty('group_id');
  });

  it('form resets after submit', () => {
    renderLogSession();
    const dateInput = screen.getByLabelText('Date') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    fireEvent.submit(screen.getByRole('button', { name: /Log Session/i }));
    expect(dateInput.value).toBe('');
  });
});
