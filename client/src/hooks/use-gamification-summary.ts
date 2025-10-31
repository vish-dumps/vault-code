import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { BadgeTier } from "@shared/gamification";

interface GamificationBreakdownItem {
  id: string;
  label: string;
  count: number;
  xpPer: number;
  total: number;
  active: boolean;
  projected?: boolean;
}

export interface GamificationSummary {
  xp: number;
  badgeTier: BadgeTier;
  nextBadge: BadgeTier | null;
  xpToNext: number;
  progressToNext: number;
  summary: {
    dailyProgress: number;
    dailyGoal: number;
    goalAchievedToday: boolean;
    questionsSolvedToday: number;
    todosCompletedToday: number;
    streak: number;
  };
  breakdown: {
    positives: GamificationBreakdownItem[];
    negatives: GamificationBreakdownItem[];
  };
  outstandingTodos: number;
  projectedPenalty: number;
  penaltyAppliedToday: boolean;
  totals: {
    positiveToday: number;
    projectedNegative: number;
  };
  suggestions: string[];
}

export function useGamificationSummary(enabled = true) {
  const { updateUser } = useAuth();

  const query = useQuery<GamificationSummary>({
    queryKey: ["/api/user/gamification"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/gamification");
      if (!response.ok) {
        throw new Error("Failed to fetch gamification summary");
      }
      return response.json();
    },
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      updateUser({
        xp: query.data.xp,
        badge: query.data.badgeTier?.name,
      });
    }
  }, [query.data, updateUser]);

  return query;
}

