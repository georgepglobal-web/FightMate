export function calculateBadges(sessions: { type: string }[]): string[] {
  const badges: string[] = [];
  const typeCounts: Record<string, number> = {};
  sessions.forEach((s) => { typeCounts[s.type] = (typeCounts[s.type] || 0) + 1; });
  const uniqueTypes = Object.keys(typeCounts).length;
  if (uniqueTypes >= 5 && sessions.length >= 10) badges.push('Most Balanced');
  const striking = ['Boxing', 'Muay Thai', 'K1', 'MMA'].reduce((sum, t) => sum + (typeCounts[t] || 0), 0);
  const grappling = ['BJJ', 'Wrestling', 'Judo', 'Takedowns'].reduce((sum, t) => sum + (typeCounts[t] || 0), 0);
  if (striking >= 5 && striking > grappling) badges.push('Best Striker');
  if (grappling >= 5 && grappling > striking) badges.push('Best Grappler');
  if ((typeCounts['Wrestling'] || 0) >= 3) badges.push('Best Wrestler');
  return badges;
}