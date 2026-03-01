import { parseDateUTC, CLASS_LEVEL_MULTIPLIERS } from './constants';
import type { DbSession } from './data-provider';

export function calculateWeeklyDiversityBonus(
  existing: Pick<DbSession, 'date' | 'type'>[],
  newSession: { date: string; type: string }
): number {
  const sessionDate = parseDateUTC(newSession.date);
  const weekStart = new Date(Date.UTC(sessionDate.getUTCFullYear(), sessionDate.getUTCMonth(), sessionDate.getUTCDate() - sessionDate.getUTCDay()));
  const weekEnd = new Date(weekStart); weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  const weekSessions = [...existing.filter((s) => { const d = parseDateUTC(s.date); return d >= weekStart && d < weekEnd; }), newSession];
  const extra = new Set(weekSessions.map((s) => s.type)).size - 1;
  return extra <= 0 ? 0 : Math.min(extra * 0.5, 1.5);
}

export function calculateSessionPoints(level: string, diversityBonus: number): number {
  return (CLASS_LEVEL_MULTIPLIERS[level] || 1.0) + diversityBonus;
}