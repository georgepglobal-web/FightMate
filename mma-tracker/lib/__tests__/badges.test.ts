import { describe, it, expect } from 'vitest';
import { calculateBadges } from '../badges';

describe('calculateBadges', () => {
  it('returns empty badges when no sessions', () => {
    const result = calculateBadges([]);
    expect(result).toEqual([]);
  });

  it('includes Most Balanced when 10 sessions with 5+ unique types', () => {
    const sessions = [
      { type: 'Boxing' }, { type: 'Boxing' },
      { type: 'BJJ' }, { type: 'BJJ' },
      { type: 'Wrestling' }, { type: 'Wrestling' },
      { type: 'Muay Thai' }, { type: 'Muay Thai' },
      { type: 'Judo' }, { type: 'Judo' }
    ];
    const result = calculateBadges(sessions);
    expect(result).toContain('Most Balanced');
  });

  it('excludes Most Balanced when 9 sessions with 5 types', () => {
    const sessions = [
      { type: 'Boxing' }, { type: 'BJJ' }, { type: 'Wrestling' },
      { type: 'Muay Thai' }, { type: 'Judo' },
      { type: 'Boxing' }, { type: 'BJJ' }, { type: 'Wrestling' }, { type: 'Muay Thai' }
    ];
    const result = calculateBadges(sessions);
    expect(result).not.toContain('Most Balanced');
  });

  it('excludes Most Balanced when 10 sessions with 4 types', () => {
    const sessions = [
      { type: 'Boxing' }, { type: 'Boxing' }, { type: 'Boxing' },
      { type: 'BJJ' }, { type: 'BJJ' }, { type: 'BJJ' },
      { type: 'Wrestling' }, { type: 'Wrestling' },
      { type: 'Muay Thai' }, { type: 'Muay Thai' }
    ];
    const result = calculateBadges(sessions);
    expect(result).not.toContain('Most Balanced');
  });

  it('includes Best Striker when 5 Boxing sessions and 0 grappling', () => {
    const sessions = [
      { type: 'Boxing' }, { type: 'Boxing' }, { type: 'Boxing' },
      { type: 'Boxing' }, { type: 'Boxing' }
    ];
    const result = calculateBadges(sessions);
    expect(result).toContain('Best Striker');
  });

  it('includes Best Grappler when 5 BJJ sessions and 0 striking', () => {
    const sessions = [
      { type: 'BJJ' }, { type: 'BJJ' }, { type: 'BJJ' },
      { type: 'BJJ' }, { type: 'BJJ' }
    ];
    const result = calculateBadges(sessions);
    expect(result).toContain('Best Grappler');
  });

  it('excludes both when equal striking and grappling (5 each)', () => {
    const sessions = [
      { type: 'Boxing' }, { type: 'Boxing' }, { type: 'Boxing' },
      { type: 'Muay Thai' }, { type: 'Muay Thai' },
      { type: 'BJJ' }, { type: 'BJJ' }, { type: 'BJJ' },
      { type: 'Wrestling' }, { type: 'Wrestling' }
    ];
    const result = calculateBadges(sessions);
    expect(result).not.toContain('Best Striker');
    expect(result).not.toContain('Best Grappler');
  });

  it('includes Best Wrestler when 3 Wrestling sessions', () => {
    const sessions = [
      { type: 'Wrestling' }, { type: 'Wrestling' }, { type: 'Wrestling' }
    ];
    const result = calculateBadges(sessions);
    expect(result).toContain('Best Wrestler');
  });

  it('can earn multiple badges simultaneously (Best Grappler + Best Wrestler)', () => {
    const sessions = [
      { type: 'Wrestling' }, { type: 'Wrestling' }, { type: 'Wrestling' },
      { type: 'BJJ' }, { type: 'BJJ' }, { type: 'BJJ' }
    ];
    const result = calculateBadges(sessions);
    expect(result).toContain('Best Grappler');
    expect(result).toContain('Best Wrestler');
  });

  it('correctly categorizes striking types', () => {
    const sessions = [
      { type: 'Boxing' }, { type: 'Muay Thai' },
      { type: 'K1' }, { type: 'MMA' }, { type: 'Boxing' }
    ];
    const result = calculateBadges(sessions);
    expect(result).toContain('Best Striker');
  });

  it('correctly categorizes grappling types', () => {
    const sessions = [
      { type: 'BJJ' }, { type: 'Wrestling' },
      { type: 'Judo' }, { type: 'Takedowns' }, { type: 'BJJ' }
    ];
    const result = calculateBadges(sessions);
    expect(result).toContain('Best Grappler');
  });
});