import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginScreen from '../LoginScreen';
import { mockLocalStorage } from '../../../lib/__tests__/test-utils';

beforeEach(() => {
  mockLocalStorage();
});

describe('LoginScreen', () => {
  it('renders username input and submit button', () => {
    render(<LoginScreen />);
    expect(screen.getByPlaceholderText(/Enter username/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
  });

  it('submit button disabled when input is empty', () => {
    render(<LoginScreen />);
    expect(screen.getByRole('button', { name: /Get Started/i })).toBeDisabled();
  });

  it('submit button enabled when input has text', () => {
    render(<LoginScreen />);
    fireEvent.change(screen.getByPlaceholderText(/Enter username/), { target: { value: 'fighter' } });
    expect(screen.getByRole('button', { name: /Get Started/i })).not.toBeDisabled();
  });

  it('shows validation for invalid username', () => {
    render(<LoginScreen />);
    fireEvent.change(screen.getByPlaceholderText(/Enter username/), { target: { value: 'a!' } });
    fireEvent.submit(screen.getByRole('button', { name: /Get Started/i }));
    expect(screen.getByText(/3-20 characters/)).toBeInTheDocument();
  });
});
