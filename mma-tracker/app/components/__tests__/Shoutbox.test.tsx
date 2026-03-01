import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockLocalStorage } from '../../../lib/__tests__/test-utils';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    getShoutboxMessages: vi.fn().mockReturnValue([]),
    addShoutboxMessage: vi.fn(),
    getMemberUsername: vi.fn().mockReturnValue(null),
    subscribe: vi.fn().mockReturnValue(() => {}),
    KEYS: { USER: 'fm-user', SESSIONS: 'fm-sessions', MEMBERS: 'fm-members', SPARRING: 'fm-sparring', SHOUTBOX: 'fm-shoutbox' },
  },
}));

vi.mock('../../../lib/data', () => ({ db: mockDb }));

// Must import component AFTER vi.mock
import Shoutbox from '../Shoutbox';

const mockMessages = [
  { id: 'm1', user_id: 'u1', type: 'user' as const, content: 'Hello fighters!', created_at: new Date().toISOString() },
  { id: 'm2', user_id: 'u2', type: 'system' as const, content: 'Bob leveled up!', created_at: new Date(Date.now() - 60000).toISOString() },
];

beforeEach(() => {
  mockLocalStorage();
  vi.clearAllMocks();
  mockDb.getShoutboxMessages.mockReturnValue([]);
  mockDb.getMemberUsername.mockReturnValue(null);
  mockDb.subscribe.mockReturnValue(() => {});
});

describe('Shoutbox', () => {
  it('renders No messages yet when empty', () => {
    render(<Shoutbox userId="u1" username="fighter" />);
    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
  });

  it('renders messages when present', () => {
    mockDb.getShoutboxMessages.mockReturnValue(mockMessages);
    render(<Shoutbox userId="u1" username="fighter" />);
    expect(screen.getByText('Hello fighters!')).toBeInTheDocument();
    expect(screen.getByText('Bob leveled up!')).toBeInTheDocument();
  });

  it('has input field and Send button', () => {
    render(<Shoutbox userId="u1" username="fighter" />);
    expect(screen.getByPlaceholderText('Say something...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('calls db.addShoutboxMessage on send', () => {
    render(<Shoutbox userId="u1" username="fighter" />);
    fireEvent.change(screen.getByPlaceholderText('Say something...'), { target: { value: 'test msg' } });
    fireEvent.click(screen.getByText('Send'));
    expect(mockDb.addShoutboxMessage).toHaveBeenCalledWith({
      user_id: 'u1', type: 'user', content: 'test msg',
    });
  });

  it('clears input after send', () => {
    render(<Shoutbox userId="u1" username="fighter" />);
    const input = screen.getByPlaceholderText('Say something...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Send'));
    expect(input.value).toBe('');
  });

  it('does not send empty message', () => {
    render(<Shoutbox userId="u1" username="fighter" />);
    fireEvent.click(screen.getByText('Send'));
    expect(mockDb.addShoutboxMessage).not.toHaveBeenCalled();
  });

  it('rate limits messages', () => {
    render(<Shoutbox userId="u1" username="fighter" />);
    const input = screen.getByPlaceholderText('Say something...');
    fireEvent.change(input, { target: { value: 'msg1' } });
    fireEvent.click(screen.getByText('Send'));
    fireEvent.change(input, { target: { value: 'msg2' } });
    fireEvent.click(screen.getByText('Send'));
    expect(screen.getByText(/Rate limit/)).toBeInTheDocument();
    expect(mockDb.addShoutboxMessage).toHaveBeenCalledTimes(1);
  });

  it('subscribes to SHOUTBOX key on mount', () => {
    render(<Shoutbox userId="u1" username="fighter" />);
    expect(mockDb.subscribe).toHaveBeenCalledWith('fm-shoutbox', expect.any(Function));
  });
});
