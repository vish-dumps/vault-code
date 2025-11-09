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
  missedDailyGoal: -25,  // Reduced from -90 to be more fair
  unfinishedTodoPenalty: -5,  // Reduced from -20 to be more reasonable
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

export type RewardType = "streak_freeze" | "double_xp" | "momentum_boost";

export interface RewardEffectConfig {
  /** Number of activations the reward grants when triggered */
  uses?: number;
  /** Multiplier applied to XP gains while the reward is active */
  multiplier?: number;
  /** Optional duration in minutes for time-bound rewards */
  durationMinutes?: number;
  /** Instant XP payload awarded on activation */
  instantXp?: number;
}

export interface RewardDefinition {
  id: string;
  type: RewardType;
  xpThreshold: number;
  name: string;
  description: string;
  icon: string;
  repeatable?: boolean;
  repeatInterval?: number;
  effect: RewardEffectConfig;
}

export const REWARD_DEFINITIONS: RewardDefinition[] = [
  {
    id: "streak-freeze-1",
    type: "streak_freeze",
    xpThreshold: 250,
    name: "Streak Freeze",
    description: "Bank a freeze to protect your streak for one missed day.",
    icon: "Snowflake",
    repeatable: true,
    repeatInterval: 1200,
    effect: {
      uses: 1,
    },
  },
  {
    id: "double-xp-1",
    type: "double_xp",
    xpThreshold: 600,
    name: "Momentum Surge",
    description: "Trigger double XP on your next solve when you need a boost.",
    icon: "Zap",
    repeatable: true,
    repeatInterval: 1800,
    effect: {
      uses: 1,
      multiplier: 2,
      durationMinutes: 60,
    },
  },
  {
    id: "streak-freeze-elite",
    type: "streak_freeze",
    xpThreshold: 1500,
    name: "Elite Freeze",
    description: "Another freeze to sustain long streaks during challenging weeks.",
    icon: "Snowflake",
    effect: {
      uses: 1,
    },
  },
  {
    id: "double-xp-pack",
    type: "double_xp",
    xpThreshold: 2500,
    name: "Hyper Focus Pack",
    description: "Three double XP charges to cash in on breakthrough sessions.",
    icon: "Flame",
    effect: {
      uses: 3,
      multiplier: 2,
      durationMinutes: 180,
    },
  },
  {
    id: "momentum-boost",
    type: "momentum_boost",
    xpThreshold: 3200,
    name: "Momentum Boost",
    description: "Trigger an instant +150 XP payout to bridge the next badge gap.",
    icon: "Rocket",
    effect: {
      instantXp: 150,
      uses: 1,
    },
  },
];

const REWARD_DEFINITION_MAP = new Map<string, RewardDefinition>(
  REWARD_DEFINITIONS.map((definition) => [definition.id, definition])
);

export function getRewardDefinition(id: string): RewardDefinition | undefined {
  const baseId = id.split("#")[0];
  return REWARD_DEFINITION_MAP.get(baseId);
}

export interface RewardUnlockCandidate {
  instanceId: string;
  definition: RewardDefinition;
  instanceIndex?: number;
  xpThreshold: number;
}

export function getEligibleRewards(
  xp: number,
  alreadyClaimedIds: Set<string>
): RewardUnlockCandidate[] {
  const unlocked: RewardUnlockCandidate[] = [];

  for (const definition of REWARD_DEFINITIONS) {
    if (definition.repeatable && definition.repeatInterval) {
      if (xp < definition.xpThreshold) continue;

      const gainedXp = xp - definition.xpThreshold;
      const cycles = Math.floor(gainedXp / definition.repeatInterval) + 1;
      for (let index = 0; index < cycles; index++) {
        const instanceThreshold = definition.xpThreshold + index * definition.repeatInterval;
        const instanceId = `${definition.id}#${index}`;
        if (!alreadyClaimedIds.has(instanceId)) {
          unlocked.push({
            instanceId,
            definition,
            instanceIndex: index,
            xpThreshold: instanceThreshold,
          });
        }
      }
      continue;
    }

    if (xp >= definition.xpThreshold && !alreadyClaimedIds.has(definition.id)) {
      unlocked.push({
        instanceId: definition.id,
        definition,
        xpThreshold: definition.xpThreshold,
      });
    }
  }

  return unlocked;
}

export function getUpcomingRewards(xp: number, limit = 3): RewardUnlockCandidate[] {
  const queued: RewardUnlockCandidate[] = [];

  for (const definition of REWARD_DEFINITIONS) {
    if (definition.repeatable && definition.repeatInterval) {
      const cyclesCompleted =
        xp >= definition.xpThreshold
          ? Math.floor((xp - definition.xpThreshold) / definition.repeatInterval) + 1
          : 0;
      const nextIndex = Math.max(0, cyclesCompleted);
      const nextThreshold = definition.xpThreshold + nextIndex * definition.repeatInterval;
      const instanceId = `${definition.id}#${nextIndex}`;
      queued.push({
        instanceId,
        definition,
        instanceIndex: nextIndex,
        xpThreshold: nextThreshold,
      });
      continue;
    }

    if (definition.xpThreshold > xp) {
      queued.push({
        instanceId: definition.id,
        definition,
        xpThreshold: definition.xpThreshold,
      });
    }
  }

  return queued
    .filter((candidate) => candidate.xpThreshold > xp)
    .sort((a, b) => a.xpThreshold - b.xpThreshold)
    .slice(0, limit);
}
