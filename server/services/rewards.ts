import { randomUUID } from "crypto";
import type {
  RewardEffectState,
  RewardInventoryItem,
  RewardSummary,
  User,
} from "@shared/schema";
import {
  RewardDefinition,
  RewardUnlockCandidate,
  getEligibleRewards,
  getUpcomingRewards,
  getRewardDefinition,
} from "@shared/gamification";

interface SyncRewardsResult {
  inventory: RewardInventoryItem[];
  newlyUnlocked: RewardSummary[];
  checkpoint: number;
}

interface ApplyEffectsResult {
  delta: number;
  effects: RewardEffectState[];
  consumedEffectIds: string[];
  expiredEffectIds: string[];
}

interface ActivationResult {
  inventory: RewardInventoryItem[];
  effects: RewardEffectState[];
  usedInventoryId: string;
  definition: RewardDefinition;
  instanceId: string;
  instantXp?: number;
}

function toDate(value: Date | string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function now(): Date {
  return new Date();
}

function cloneInventory(items: RewardInventoryItem[] | undefined | null): RewardInventoryItem[] {
  return Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
}

function cloneEffects(effects: RewardEffectState[] | undefined | null): RewardEffectState[] {
  return Array.isArray(effects)
    ? effects.map((effect) => ({
        ...effect,
        activatedAt: effect.activatedAt ? new Date(effect.activatedAt) : now(),
        expiresAt: effect.expiresAt ? new Date(effect.expiresAt) : undefined,
      }))
    : [];
}

function buildSummary(
  definition: RewardDefinition,
  instanceId: string,
  xpThreshold: number,
  instanceIndex?: number,
  inventoryItem?: RewardInventoryItem,
  effect?: RewardEffectState
): RewardSummary {
  return {
    definition,
    instanceId,
    instanceIndex,
    xpThreshold,
    inventoryItem,
    effect,
    unlockedAt: inventoryItem?.earnedAt,
  };
}

export function syncRewardInventory(user: User): SyncRewardsResult {
  const xp = Math.max(0, user.xp ?? 0);
  const inventory = cloneInventory(user.rewardsInventory);
  const claimedInstances = new Set(inventory.map((item) => item.instanceId));
  const unlockedCandidates = getEligibleRewards(xp, claimedInstances);
  const newlyUnlocked: RewardSummary[] = [];

  for (const candidate of unlockedCandidates) {
    const { definition, instanceId, xpThreshold, instanceIndex } = candidate;
    const earnedAt = now();
    const inventoryItem: RewardInventoryItem = {
      id: randomUUID(),
      rewardId: definition.id,
      instanceId,
      status: "available",
      earnedAt,
      metadata: {
        xpThreshold,
        instanceIndex: instanceIndex ?? null,
      },
    };
    inventory.push(inventoryItem);
    newlyUnlocked.push(
      buildSummary(definition, instanceId, xpThreshold, instanceIndex, inventoryItem)
    );
  }

  return {
    inventory,
    newlyUnlocked,
    checkpoint: xp,
  };
}

export function applyRewardEffectsToXp(user: User, baseDelta: number): ApplyEffectsResult {
  if (!baseDelta) {
    return {
      delta: baseDelta,
      effects: cloneEffects(user.rewardEffects),
      consumedEffectIds: [],
      expiredEffectIds: [],
    };
  }

  const nowDate = now();
  const effects = cloneEffects(user.rewardEffects);
  let delta = baseDelta;
  const consumedEffectIds: string[] = [];
  const expiredEffectIds: string[] = [];

  for (const effect of effects.slice()) {
    if (effect.expiresAt && effect.expiresAt.getTime() < nowDate.getTime()) {
      expiredEffectIds.push(effect.id);
      continue;
    }

    if (effect.type === "double_xp" && baseDelta > 0) {
      const multiplier =
        (effect.metadata?.multiplier && Number(effect.metadata.multiplier)) || 2;
      delta = Math.round(delta * multiplier);
      effect.usesRemaining = (effect.usesRemaining ?? 1) - 1;

      if ((effect.usesRemaining ?? 0) <= 0) {
        consumedEffectIds.push(effect.id);
      }
    }
  }

  const filteredEffects = effects.filter(
    (effect) =>
      !consumedEffectIds.includes(effect.id) && !expiredEffectIds.includes(effect.id)
  );

  return {
    delta,
    effects: filteredEffects,
    consumedEffectIds,
    expiredEffectIds,
  };
}

function createEffectFromDefinition(
  definition: RewardDefinition,
  instanceId: string
): RewardEffectState | null {
  if (definition.type === "momentum_boost") {
    return null;
  }

  const uses = definition.effect.uses ?? 1;
  const expiresAt =
    definition.effect.durationMinutes && definition.effect.durationMinutes > 0
      ? new Date(Date.now() + definition.effect.durationMinutes * 60 * 1000)
      : undefined;

  return {
    id: randomUUID(),
    rewardId: definition.id,
    instanceId,
    type: definition.type,
    activatedAt: now(),
    expiresAt,
    usesRemaining: uses,
    metadata: {
      multiplier: definition.effect.multiplier ?? null,
    },
  };
}

export function activateReward(
  user: User,
  instanceId: string
): ActivationResult | undefined {
  const inventory = cloneInventory(user.rewardsInventory);
  const effects = cloneEffects(user.rewardEffects);
  const target = inventory.find(
    (item) => item.instanceId === instanceId || item.id === instanceId
  );

  if (!target || target.status !== "available") {
    return undefined;
  }

  const definition = getRewardDefinition(target.instanceId) ?? getRewardDefinition(target.rewardId);
  if (!definition) {
    return undefined;
  }

  target.status = "consumed";
  target.usedAt = now();

  let instantXp: number | undefined;
  if (definition.type === "momentum_boost") {
    instantXp = definition.effect.instantXp ?? 0;
  } else {
    const effect = createEffectFromDefinition(definition, target.instanceId);
    if (effect) {
      effects.push(effect);
    }
  }

  return {
    inventory,
    effects,
    usedInventoryId: target.id,
    definition,
    instanceId: target.instanceId,
    instantXp,
  };
}

export function buildRewardOverview(user: User) {
  const xp = Math.max(0, user.xp ?? 0);
  const inventory = cloneInventory(user.rewardsInventory);
  const effects = cloneEffects(user.rewardEffects);

  const available = inventory
    .filter((item) => item.status === "available")
    .map((item) => {
      const definition =
        getRewardDefinition(item.instanceId) ?? getRewardDefinition(item.rewardId);
      if (!definition) return null;
      return buildSummary(
        definition,
        item.instanceId,
        Number(item.metadata?.xpThreshold ?? 0),
        item.metadata?.instanceIndex ?? undefined,
        item
      );
    })
    .filter((value): value is RewardSummary => Boolean(value));

  const active = effects
    .map((effect) => {
      const definition =
        getRewardDefinition(effect.instanceId) ?? getRewardDefinition(effect.rewardId);
      if (!definition) return null;
      const metadata = inventory.find((item) => item.instanceId === effect.instanceId);
      return buildSummary(
        definition,
        effect.instanceId,
        Number(metadata?.metadata?.xpThreshold ?? 0),
        metadata?.metadata?.instanceIndex ?? undefined,
        metadata,
        effect
      );
    })
    .filter((value): value is RewardSummary => Boolean(value));

  const upcomingCandidates = getUpcomingRewards(xp, 3);
  const upcoming = upcomingCandidates
    .map((candidate) => {
      const definition = candidate.definition;
      return buildSummary(
        definition,
        candidate.instanceId,
        candidate.xpThreshold,
        candidate.instanceIndex
      );
    })
    .filter((value): value is RewardSummary => Boolean(value));

  return {
    available,
    active,
    upcoming,
  };
}
