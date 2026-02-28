import React from 'react';
import { render } from '@testing-library/react';

export function mockLocalStorage() {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
  };
  global.localStorage = mockStorage as Storage;
  return mockStorage;
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui);
}
