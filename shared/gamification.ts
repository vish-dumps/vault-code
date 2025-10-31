export interface BadgeTier {
  name: string;
  minXp: number;
  color: string;
  description: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  { name: "Novice", minXp: 0, color: "#94a3b8", description: "Starting your CodeVault journey." },
  { name: "Apprentice", minXp: 250, color: "#6366f1", description: "Consistent progress unlocked." },
  { name: "Pro", minXp: 750, color: "#0ea5e9", description: "Dialed-in reps and confident execution." },
  { name: "Elite", minXp: 1500, color: "#10b981", description: "Goals met and momentum rising." },
  { name: "Master", minXp: 2500, color: "#f59e0b", description: "Masterful discipline and leadership." },
  { name: "Grandmaster", minXp: 4000, color: "#ef4444", description: "Dominating daily challenges." },
  { name: "Legend", minXp: 6000, color: "#a855f7", description: "Elite CodeVault guardian." },
];

export const XP_REWARDS = {
  solvedProblem: {
    Easy: 50,
    Medium: 80,
    Hard: 120,
  },
  manual: {
    addQuestionToVault: 7,
    completeTodoTask: 3,
  },
  dailyGoalBonus: 120,
  missedDailyGoal: -90,
  unfinishedTodoPenalty: -20,
  registrationBonus: 80,
} as const;

export const XP_PROGRESS_PARAMS = {
  interval: 900, // XP required before each decay step
  decrement: 0.08, // 8% reduction per interval
  minMultiplier: 0.45 // never drop below 45% of base XP
} as const;

export const XP_COMBO_RULES = {
  windowMinutes: 45,
  bonusStep: 0.18, // +18% per chained solve
  maxBonusMultiplier: 0.75 // cap bonus at 75% of adjusted XP
} as const;

export function getBadgeForXp(xp: number): BadgeTier {
  let current = BADGE_TIERS[0];
  for (const tier of BADGE_TIERS) {
    if (xp >= tier.minXp) {
      current = tier;
    } else {
      break;
    }
  }
  return current;
}

export function getNextBadge(xp: number): BadgeTier | null {
  let next: BadgeTier | null = null;
  for (const tier of BADGE_TIERS) {
    if (tier.minXp > xp && (!next || tier.minXp < next.minXp)) {
      next = tier;
    }
  }
  return next;
}

export function getSolvedProblemXp(difficulty: string | null | undefined): number {
  const normalized = difficulty?.toString().toLowerCase() ?? "medium";
  if (normalized === "easy") return XP_REWARDS.solvedProblem.Easy;
  if (normalized === "hard") return XP_REWARDS.solvedProblem.Hard;
  return XP_REWARDS.solvedProblem.Medium;
}

export function applyProgressiveScaling(baseXp: number, currentXp: number | null | undefined) {
  const { interval, decrement, minMultiplier } = XP_PROGRESS_PARAMS;
  const safeBase = Math.max(0, baseXp);
  if (safeBase === 0) {
    return { adjustedXp: 0, multiplier: 0 };
  }

  const xp = Math.max(0, currentXp ?? 0);
  const tier = Math.max(0, Math.floor(xp / interval));
  const multiplier = Math.max(minMultiplier, 1 - tier * decrement);
  const adjustedXp = Math.max(5, Math.round(safeBase * multiplier));

  return { adjustedXp, multiplier };
}

export function calculateComboBonus(adjustedXp: number, comboCount: number) {
  if (adjustedXp <= 0 || comboCount <= 1) {
    return { bonusXp: 0, multiplier: 1 };
  }

  const { bonusStep, maxBonusMultiplier } = XP_COMBO_RULES;
  const bonusMultiplier = Math.min(bonusStep * (comboCount - 1), maxBonusMultiplier);
  const bonusXp = Math.round(adjustedXp * bonusMultiplier);

  return { bonusXp, multiplier: 1 + bonusMultiplier };
}
