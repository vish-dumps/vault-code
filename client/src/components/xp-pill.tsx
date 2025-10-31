import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGamificationSummary } from "@/hooks/use-gamification-summary";
import { getBadgeForXp, getNextBadge } from "@shared/gamification";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GamificationSummaryCard } from "@/components/gamification-summary-card";

export function XpPill() {
  const { user } = useAuth();
  const { data, isLoading } = useGamificationSummary(!!user);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  const handleHoverEnter = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);
  const handleHoverLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  if (!user && !data) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <div className="hidden sm:flex flex-col items-end gap-1 pr-2">
        <div className="h-8 w-28 rounded-full bg-muted animate-pulse" />
        <div className="h-2 w-24 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const xp = data?.xp ?? user?.xp ?? 0;
  const badgeTier = data?.badgeTier ?? getBadgeForXp(xp);
  const nextBadge = data?.nextBadge ?? getNextBadge(xp);
  const progress =
    data?.progressToNext ??
    (nextBadge && nextBadge.minXp !== badgeTier.minXp
      ? Math.min(1, Math.max(0, (xp - badgeTier.minXp) / (nextBadge.minXp - badgeTier.minXp)))
      : 1);
  const xpToNext = data?.xpToNext ?? (nextBadge ? Math.max(0, nextBadge.minXp - xp) : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onClick={() => setOpen((prev) => !prev)}
          className="hidden sm:flex flex-col items-end gap-1 pr-2 focus:outline-none"
          aria-expanded={open}
          aria-label="View XP momentum"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border/30 px-3 py-1 text-xs font-semibold shadow-sm transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: `${badgeTier.color}1a`,
              color: badgeTier.color,
            }}
          >
            <Sparkles className="h-3 w-3" />
            <span>{xp} XP</span>
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">
              {badgeTier.name}
            </span>
          </div>
          <div className="flex w-28 items-center gap-2">
            <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%`, backgroundColor: badgeTier.color }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {nextBadge ? `${xpToNext} XP` : 'MAX'}
            </span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[22rem] p-0 shadow-xl"
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
      >
        <GamificationSummaryCard className="w-full border-0 shadow-none" />
      </PopoverContent>
    </Popover>
  );
}
