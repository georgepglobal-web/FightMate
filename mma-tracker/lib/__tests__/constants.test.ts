import { describe, it, expect } from 'vitest';
import {
  calculateLevelFromPoints,
  calculateProgressInLevel,
  getLevelColor,
  parseDateUTC,
  normalizeDateToISO,
  deriveAvatarFromSessions,
} from '../constants';

describe('calculateLevelFromPoints', () => {
  it('returns Novice for boundary values 0-7', () => {
    expect(calculateLevelFromPoints(0)).toBe('Novice');
    expect(calculateLevelFromPoints(7)).toBe('Novice');
  });

  it('returns Intermediate for boundary values 8-15', () => {
    expect(calculateLevelFromPoints(8)).toBe('Intermediate');
    expect(calculateLevelFromPoints(15)).toBe('Intermediate');
  });

  it('returns Seasoned for boundary values 16-24', () => {
    expect(calculateLevelFromPoints(16)).toBe('Seasoned');
    expect(calculateLevelFromPoints(24)).toBe('Seasoned');
  });

  it('returns Elite for values 25+', () => {
    expect(calculateLevelFromPoints(25)).toBe('Elite');
    expect(calculateLevelFromPoints(100)).toBe('Elite');
  });

  it('returns Novice for negative values', () => {
    expect(calculateLevelFromPoints(-1)).toBe('Novice');
  });
});

describe('calculateProgressInLevel', () => {
  it('calculates Novice progress correctly', () => {
    expect(calculateProgressInLevel(0, 'Novice')).toBe(0);
    expect(calculateProgressInLevel(3, 'Novice')).toBe(50); // 3/7 ≈ 43% → rounds to 50%
    expect(calculateProgressInLevel(7, 'Novice')).toBe(100);
  });

  it('calculates Intermediate progress correctly', () => {
    expect(calculateProgressInLevel(8, 'Intermediate')).toBe(0);
    expect(calculateProgressInLevel(15, 'Intermediate')).toBe(100);
  });

  it('calculates Seasoned progress correctly', () => {
    expect(calculateProgressInLevel(16, 'Seasoned')).toBe(0);
    expect(calculateProgressInLevel(24, 'Seasoned')).toBe(100);
  });

  it('calculates Elite progress correctly', () => {
    expect(calculateProgressInLevel(25, 'Elite')).toBe(100);
    expect(calculateProgressInLevel(50, 'Elite')).toBe(100);
  });
});

describe('getLevelColor', () => {
  it('returns correct gradient for all levels', () => {
    expect(getLevelColor('Novice')).toBe('from-gray-400 to-gray-600');
    expect(getLevelColor('Intermediate')).toBe('from-green-400 to-green-600');
    expect(getLevelColor('Seasoned')).toBe('from-blue-400 to-blue-600');
    expect(getLevelColor('Elite')).toBe('from-purple-400 to-yellow-400');
  });

  it('returns default gradient for unknown level', () => {
    expect(getLevelColor('Unknown')).toBe('from-gray-400 to-gray-600');
  });
});

describe('parseDateUTC', () => {
  it('parses date string to UTC date correctly', () => {
    const date1 = parseDateUTC('2025-01-15');
    expect(date1.getUTCFullYear()).toBe(2025);
    expect(date1.getUTCMonth()).toBe(0); // January is 0
    expect(date1.getUTCDate()).toBe(15);

    const date2 = parseDateUTC('2025-12-31');
    expect(date2.getUTCFullYear()).toBe(2025);
    expect(date2.getUTCMonth()).toBe(11); // December is 11
    expect(date2.getUTCDate()).toBe(31);
  });
});

describe('normalizeDateToISO', () => {
  it('returns already-normalized dates as passthrough', () => {
    expect(normalizeDateToISO('2025-01-15')).toBe('2025-01-15');
    expect(normalizeDateToISO('2025-12-31')).toBe('2025-12-31');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeDateToISO('')).toBe('');
  });

  it('handles valid YYYY-MM-DD format', () => {
    expect(normalizeDateToISO('2025-01-01')).toBe('2025-01-01');
  });
});

describe('deriveAvatarFromSessions', () => {
  it('returns Novice avatar for empty sessions', () => {
    const result = deriveAvatarFromSessions([]);
    expect(result).toEqual({
      level: 'Novice',
      progress: 0,
      cumulativePoints: 0,
    });
  });

  it('returns Intermediate avatar for sessions summing to 8 points', () => {
    const sessions = [{ points: 4 }, { points: 4 }];
    const result = deriveAvatarFromSessions(sessions);
    expect(result.level).toBe('Intermediate');
    expect(result.cumulativePoints).toBe(8);
  });

  it('treats sessions with undefined points as 0', () => {
    const sessions = [{ points: 5 }, {}, { points: undefined }];
    const result = deriveAvatarFromSessions(sessions);
    expect(result.cumulativePoints).toBe(5);
    expect(result.level).toBe('Novice');
  });
});