import { describe, it, expect } from 'vitest';
import { calculateWeeklyDiversityBonus, calculateSessionPoints } from '../points';

describe('calculateWeeklyDiversityBonus', () => {
  it('returns 0 bonus when no existing sessions in week', () => {
    const result = calculateWeeklyDiversityBonus([], { date: '2024-01-15', type: 'Boxing' });
    expect(result).toBe(0);
  });

  it('returns 0 bonus when 1 existing session same type as new', () => {
    const existing = [{ date: '2024-01-15', type: 'Boxing' }];
    const result = calculateWeeklyDiversityBonus(existing, { date: '2024-01-16', type: 'Boxing' });
    expect(result).toBe(0);
  });

  it('returns 0.5 bonus when 1 existing session different type', () => {
    const existing = [{ date: '2024-01-15', type: 'Boxing' }];
    const result = calculateWeeklyDiversityBonus(existing, { date: '2024-01-16', type: 'BJJ' });
    expect(result).toBe(0.5);
  });

  it('returns 1.5 bonus (capped) when 3 existing sessions all different + new different', () => {
    const existing = [
      { date: '2024-01-15', type: 'Boxing' },
      { date: '2024-01-16', type: 'BJJ' },
      { date: '2024-01-17', type: 'Wrestling' }
    ];
    const result = calculateWeeklyDiversityBonus(existing, { date: '2024-01-18', type: 'Muay Thai' });
    expect(result).toBe(1.5);
  });

  it('returns 1.5 (cap) when 5 existing sessions all different + new different', () => {
    const existing = [
      { date: '2024-01-15', type: 'Boxing' },
      { date: '2024-01-16', type: 'BJJ' },
      { date: '2024-01-17', type: 'Wrestling' },
      { date: '2024-01-18', type: 'Muay Thai' },
      { date: '2024-01-19', type: 'Judo' }
    ];
    const result = calculateWeeklyDiversityBonus(existing, { date: '2024-01-20', type: 'MMA' });
    expect(result).toBe(1.5);
  });

  it('ignores sessions from a different week', () => {
    const existing = [
      { date: '2024-01-08', type: 'Boxing' }, // Previous week
      { date: '2024-01-15', type: 'BJJ' }     // Same week
    ];
    const result = calculateWeeklyDiversityBonus(existing, { date: '2024-01-16', type: 'Wrestling' });
    expect(result).toBe(0.5); // Only 1 extra type (BJJ vs Wrestling)
  });
});

describe('calculateSessionPoints', () => {
  it('calculates Basic level points correctly', () => {
    expect(calculateSessionPoints('Basic', 0)).toBe(1.0);
    expect(calculateSessionPoints('Basic', 0.5)).toBe(1.5);
  });

  it('calculates Intermediate level points correctly', () => {
    expect(calculateSessionPoints('Intermediate', 0)).toBe(1.5);
    expect(calculateSessionPoints('Intermediate', 0.5)).toBe(2.0);
  });

  it('calculates Advanced level points correctly', () => {
    expect(calculateSessionPoints('Advanced', 0)).toBe(2.0);
    expect(calculateSessionPoints('Advanced', 1.5)).toBe(3.5);
  });

  it('calculates All Level points correctly', () => {
    expect(calculateSessionPoints('All Level', 0)).toBe(1.3);
    expect(calculateSessionPoints('All Level', 1.0)).toBe(2.3);
  });

  it('defaults to 1.0 for unknown level', () => {
    expect(calculateSessionPoints('Unknown', 0)).toBe(1.0);
    expect(calculateSessionPoints('Unknown', 0.5)).toBe(1.5);
  });

  it('adds diversity bonus correctly', () => {
    expect(calculateSessionPoints('Basic', 1.5)).toBe(2.5);
    expect(calculateSessionPoints('Advanced', 1.0)).toBe(3.0);
  });
});