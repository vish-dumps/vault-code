import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  RefreshCw,
  Gift,
  Zap,
  Snowflake,
  History,
  ArrowUpRight,
  Target,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamificationSummary } from "@/hooks/use-gamification-summary";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface GamificationSummaryCardProps {
  className?: string;
}

function formatDelta(value: number) {
  if (value > 0) return `+${value} XP`;
  if (value < 0) return `${value} XP`;
  return "+0 XP";
}

const platformVisuals: Record<
  string,
  { icon: JSX.Element; badge: string; text: string }
> = {
  leetcode: {
    icon: <Sparkles className="h-4 w-4 text-amber-300" />,
    badge: "bg-amber-500/10 text-amber-200",
    text: "text-amber-100",
  },
  codeforces: {
    icon: <Code2 className="h-4 w-4 text-sky-300" />,
    badge: "bg-sky-500/10 text-sky-100",
    text: "text-sky-100",
  },
  goal: {
    icon: <Target className="h-4 w-4 text-emerald-300" />,
    badge: "bg-emerald-500/10 text-emerald-100",
    text: "text-emerald-100",
  },
};

export function GamificationSummaryCard({ className }: GamificationSummaryCardProps) {
  const { data, isLoading, isError, refetch, isFetching } = useGamificationSummary();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const rewardActivation = useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiRequest("POST", `/api/user/rewards/${instanceId}/use`);
      let body: any = {};
      try {
        body = await response.json();
      } catch {
        body = {};
      }
      if (!response.ok) {
        throw new Error(body?.error || "Failed to activate reward");
      }
      return body;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/gamification"] });
      const rewardName = result?.reward?.name || "Reward";
      const instantXp = Number(result?.instantXp ?? 0);
      toast({
        title: `${rewardName} activated`,
        description:
          instantXp > 0 ? `Instant +${instantXp} XP applied.` : "Reward ready to boost your next sessions.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Activation failed",
        description: error instanceof Error ? error.message : "Unable to activate reward.",
        variant: "destructive",
      });
    },
  });

  const activatingInstance = rewardActivation.variables as string | undefined;
  const isActivating = rewardActivation.isPending;

  const renderRewardIcon = (type: string) => {
    if (type === "double_xp") {
      return <Zap className="h-4 w-4 text-amber-500" />;
    }
    if (type === "streak_freeze") {
      return <Snowflake className="h-4 w-4 text-sky-400" />;
    }
    return <Gift className="h-4 w-4 text-violet-400" />;
  };

  if (isLoading && !data) {
    return (
      <Card className={cn("w-[520px] max-w-[92vw] rounded-3xl border-none bg-slate-950/80", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <Sparkles className="h-4 w-4 text-amber-400" />
              XP Momentum
            </CardTitle>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (isError && !data) {
    return (
      <Card className={cn("rounded-3xl bg-slate-950/80 text-slate-100", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            XP Momentum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>We couldn’t load your XP summary right now.</p>
          <Button size="sm" onClick={() => refetch()} variant="outline">
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const {
    badgeTier,
    nextBadge,
    xp,
    xpToNext,
    progressToNext,
    breakdown,
    totals,
    suggestions,
    rewards,
    xpHistory,
  } = data;

  const positiveItems = breakdown.positives;
  const negativeItems = breakdown.negatives;
  const progressValue = Math.min(100, Math.max(0, progressToNext * 100));
  const availableRewards = rewards?.available ?? [];
  const activeRewards = rewards?.active ?? [];
  const upcomingRewards = rewards?.upcoming ?? [];
  const xpHistoryPreview = xpHistory.slice(0, 5);

  const xpProgressLabel = nextBadge ? `${xpToNext} XP until ${nextBadge.name}` : "Top tier unlocked";

  return (
    <Card
      className={cn(
        "w-full min-w-[320px] max-h-[70vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-950 to-slate-900 text-slate-50 shadow-2xl backdrop-blur",
        className
      )}
    >
      <CardHeader className="space-y-3 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-fuchsia-500/10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">XP Momentum</p>
            <CardTitle className="text-2xl font-semibold text-slate-50">Keep stacking wins</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-xs text-slate-200">
            {badgeTier.name}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Stay sharp, dodge penalties, and ride your streak.</span>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1.35fr,1fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total XP</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-slate-50">{xp}</span>
                    <span className="text-sm text-slate-400">{xpProgressLabel}</span>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                  {nextBadge ? `${nextBadge.name} up next` : "Legend tier"}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Progress value={progressValue} className="h-3 bg-white/10" />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{badgeTier.name}</span>
                  <span>{nextBadge ? `${xpToNext} XP to go` : "Maxed out"}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-50">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span>Positive flow</span>
                  <span>{formatDelta(totals.positiveToday)}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {positiveItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-emerald-100">
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-emerald-200/80">
                          {item.count} × {item.xpPer} XP
                        </p>
                      </div>
                      <span className="text-xs font-semibold">{formatDelta(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-50">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span>Risk zone</span>
                  <span>{formatDelta(totals.projectedNegative)}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {negativeItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-rose-100">
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-rose-200/80">
                          {item.count} × {item.xpPer} XP {item.projected ? "(projected)" : ""}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">{formatDelta(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />
                  Momentum cues
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion} className="flex items-start gap-2">
                      <ArrowUpRight className="mt-0.5 h-4 w-4 text-cyan-300" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Rewards vault</p>
                  <p className="text-sm text-slate-200">Activate boosts when you need them.</p>
                </div>
                <Badge variant="outline" className="border-white/20 text-slate-200">
                  {availableRewards.length} ready
                </Badge>
              </div>
              <div className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                  {availableRewards.length > 0 ? (
                    availableRewards.map((reward) => (
                      <motion.div
                        key={reward.instanceId}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-white/10 p-2 text-slate-300">
                            {renderRewardIcon(reward.definition.type)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-100">{reward.definition.name}</div>
                            <p className="text-xs text-slate-300">{reward.definition.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => rewardActivation.mutate(reward.instanceId)}
                          disabled={isActivating && activatingInstance === reward.instanceId}
                        >
                          {isActivating && activatingInstance === reward.instanceId ? "Activating..." : "Use now"}
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      Earn more XP to unlock tactical boosts like streak freezes and XP surges.
                    </p>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                  <div className="text-xs font-semibold uppercase text-slate-400">Active boosts</div>
                  {activeRewards.length > 0 ? (
                    <div className="space-y-2 text-xs text-slate-300">
                      {activeRewards.map((reward) => {
                        const expiresAtRaw = reward.effect?.expiresAt ?? null;
                        const expiresAt =
                          expiresAtRaw instanceof Date
                            ? expiresAtRaw
                            : expiresAtRaw
                            ? new Date(expiresAtRaw)
                            : null;
                        const expiresLabel =
                          expiresAt && !Number.isNaN(expiresAt.getTime())
                            ? ` · Ends ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
                            : "";
                        const usesRemaining = reward.effect?.usesRemaining ?? null;
                        return (
                          <div key={reward.instanceId} className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-100">{reward.definition.name}</div>
                              <div>
                                {usesRemaining !== null
                                  ? `${usesRemaining} use${usesRemaining === 1 ? "" : "s"} left`
                                  : "Ready"}
                                {expiresLabel}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No active boosts at the moment.</p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                  <div className="text-xs font-semibold uppercase text-slate-400">Upcoming rewards</div>
                  {upcomingRewards.length > 0 ? (
                    <div className="space-y-2 text-xs text-slate-300">
                      {upcomingRewards.map((reward) => {
                        const xpNeeded = Math.max(0, reward.xpThreshold - xp);
                        return (
                          <div key={`${reward.instanceId}-upcoming`} className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-100">{reward.definition.name}</div>
                              <div>{xpNeeded} XP to unlock</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Keep earning XP to discover more boosts.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <History className="h-4 w-4 text-indigo-300" />
                  XP log
                </div>
                <Badge variant="secondary" className="bg-white/10 text-slate-200">
                  Live
                </Badge>
              </div>
              <div className="mt-3 space-y-3">
                <AnimatePresence initial={false}>
                  {xpHistoryPreview.length > 0 ? (
                    xpHistoryPreview.map((entry) => {
                      const key = entry.type === "goal" ? "goal" : entry.platform?.toLowerCase() ?? "default";
                      const visuals = platformVisuals[key] ?? {
                        icon: <Sparkles className="h-4 w-4 text-slate-200" />,
                        badge: "bg-white/10 text-slate-200",
                        text: "text-slate-200",
                      };
                      const timestamp = formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true });
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <div className="rounded-full bg-white/10 p-2">{visuals.icon}</div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-100">{entry.title}</p>
                              <span className="text-xs text-slate-400">{timestamp}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge className={cn("text-xs font-medium", visuals.badge)}>
                                {entry.type === "goal" ? "Goal bonus" : entry.platform || "Saved"}
                              </Badge>
                              <span className="text-sm font-semibold text-emerald-300">
                                +{Math.round(entry.xp)} XP
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">No XP entries yet. Solve a problem to get started.</p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>
        {isFetching && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing latest stats...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
