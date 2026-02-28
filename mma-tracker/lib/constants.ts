// Session type options
export const SESSION_TYPES = [
  "Boxing", "Muay Thai", "K1", "BJJ", "Wrestling", "MMA",
  "Takedowns", "Judo", "Strength & Conditioning", "Weight Training", "Cardio",
];

// Class levels
export const CLASS_LEVELS = ["Basic", "Intermediate", "Advanced", "All Level"];

// Avatar levels
export const AVATAR_LEVELS = ["Novice", "Intermediate", "Seasoned", "Elite"] as const;

// Level thresholds (cumulative points)
export const LEVEL_THRESHOLDS = {
  Novice: { min: 0, max: 7 },
  Intermediate: { min: 8, max: 15 },
  Seasoned: { min: 16, max: 24 },
  Elite: { min: 25, max: Infinity },
} as const;

// Class level multipliers
export const CLASS_LEVEL_MULTIPLIERS: Record<string, number> = {
  Basic: 1.0, Intermediate: 1.5, Advanced: 2.0, "All Level": 1.3,
};

// Default group ID
export const DEFAULT_GROUP_ID = "global";

// Application version
export const APP_VERSION = "1.0";

// Types
export interface Avatar {
  level: "Novice" | "Intermediate" | "Seasoned" | "Elite";
  progress: number;
  cumulativePoints: number;
}

export interface MemberRanking {
  userId: string;
  name: string;
  score: number;
  badges: string[];
  avatarLevel?: "Novice" | "Intermediate" | "Seasoned" | "Elite";
  isCurrentUser?: boolean;
}

// Pure helpers
export const calculateLevelFromPoints = (points: number): Avatar["level"] => {
  if (points >= LEVEL_THRESHOLDS.Elite.min) return "Elite";
  if (points >= LEVEL_THRESHOLDS.Seasoned.min) return "Seasoned";
  if (points >= LEVEL_THRESHOLDS.Intermediate.min) return "Intermediate";
  return "Novice";
};

export const calculateProgressInLevel = (points: number, level: Avatar["level"]): number => {
  const threshold = LEVEL_THRESHOLDS[level];
  const range = threshold.max - threshold.min;
  if (range === Infinity || level === "Elite") return points >= threshold.min ? 100 : 0;
  const pointsInLevel = Math.max(0, points - threshold.min);
  const rawProgress = Math.min(100, (pointsInLevel / range) * 100);
  return Math.round(rawProgress / 25) * 25;
};

export const getLevelColor = (level: string) => {
  switch (level) {
    case "Novice": return "from-gray-400 to-gray-600";
    case "Intermediate": return "from-green-400 to-green-600";
    case "Seasoned": return "from-blue-400 to-blue-600";
    case "Elite": return "from-purple-400 to-yellow-400";
    default: return "from-gray-400 to-gray-600";
  }
};

export const parseDateUTC = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const normalizeDateToISO = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-");
    if (year && month && day && year.length === 4 && month.length === 2 && day.length === 2) return dateString;
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return dateString;
    return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  } catch { return dateString; }
};

export const deriveAvatarFromSessions = (allSessions: { points?: number }[]): Avatar => {
  const totalPoints = allSessions.reduce((sum, s) => sum + (s.points || 0), 0);
  const level = calculateLevelFromPoints(totalPoints);
  return { level, progress: calculateProgressInLevel(totalPoints, level), cumulativePoints: totalPoints };
};
