import { Sparkles, TrendingUp, ShieldAlert, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamificationSummary } from "@/hooks/use-gamification-summary";
import { cn } from "@/lib/utils";

interface GamificationSummaryCardProps {
  className?: string;
}

function formatDelta(value: number) {
  if (value > 0) return `+${value} XP`;
  if (value < 0) return `${value} XP`;
  return "+0 XP";
}

export function GamificationSummaryCard({ className }: GamificationSummaryCardProps) {
  const { data, isLoading, isError, refetch, isFetching } = useGamificationSummary();

  if (isLoading && !data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              XP Momentum
            </CardTitle>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (isError && !data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            XP Momentum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>We couldn&rsquo;t load your XP summary right now.</p>
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

  const { badgeTier, nextBadge, xp, xpToNext, progressToNext, breakdown, totals, suggestions } = data;
  const positiveItems = breakdown.positives;
  const negativeItems = breakdown.negatives;
  const progressValue = Math.min(100, Math.max(0, progressToNext * 100));

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              XP Momentum
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Keep stacking points and dodging penalties.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: `${badgeTier.color}1a`,
                color: badgeTier.color,
              }}
            >
              {badgeTier.name}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh XP summary</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Total XP
              </div>
              <div className="text-3xl font-bold">{xp}</div>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              {nextBadge ? `${nextBadge.name} up next` : "Legend unlocked"}
            </Badge>
          </div>
          <div>
            <Progress value={progressValue} className="h-2" />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {nextBadge ? `${xpToNext} XP until ${nextBadge.name}` : "You&rsquo;re at the top tier"}
              </span>
              <span>{formatDelta(totals.positiveToday)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200/40 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-900/10 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              Positive Flow
              <span>{formatDelta(totals.positiveToday)}</span>
            </div>
            <div className="mt-2 space-y-2">
              {positiveItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.count} &times; {item.xpPer} XP
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${item.total > 0 ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}`}>
                    {formatDelta(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-rose-200/40 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-900/10 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
              Risk Zone
              <span>{formatDelta(totals.projectedNegative)}</span>
            </div>
            <div className="mt-2 space-y-2">
              {negativeItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.count} {item.count === 1 ? "item" : "items"} &times; {item.xpPer} XP
                      {item.projected ? " (projected)" : ""}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${item.total < 0 ? "text-rose-600 dark:text-rose-300" : "text-muted-foreground"}`}>
                    {formatDelta(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Next Moves
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {suggestions.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/40" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
