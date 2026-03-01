import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatFAB from '../ChatFAB';

describe('ChatFAB', () => {
  it('renders chat button', () => {
    render(<ChatFAB unreadCount={0} onClick={() => {}} />);
    expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
  });

  it('hides badge when unread is 0', () => {
    const { container } = render(<ChatFAB unreadCount={0} onClick={() => {}} />);
    expect(container.querySelector('.bg-rose-500')).not.toBeInTheDocument();
  });

  it('shows unread count badge when > 0', () => {
    render(<ChatFAB unreadCount={5} onClick={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays 99+ when count exceeds 99', () => {
    render(<ChatFAB unreadCount={150} onClick={() => {}} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ChatFAB unreadCount={0} onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
