import { Card } from "@/components/ui/card";
import { Info, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface ContributionHeatmapProps {
  data?: Array<{ date: string; count: number }>;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Configuration from example (Adapted for Shadcn Theme)
const THEME = {
  // Use semantic classes instead of hardcoded hex
  bg: 'bg-card',
  textMain: 'text-card-foreground',
  textMuted: 'text-muted-foreground',
  border: 'border-border',
  cellEmpty: 'bg-muted/40',
  // Standard Emerald Scale for better Light/Dark compatibility
  colors: [
    'bg-muted/40',      // Level 0 (Empty)
    'bg-emerald-200 dark:bg-emerald-900/40', // Level 1
    'bg-emerald-300 dark:bg-emerald-700/60', // Level 2
    'bg-emerald-400 dark:bg-emerald-600',    // Level 3
    'bg-emerald-500 dark:bg-emerald-500',    // Level 4
  ]
};

const getContributionLevel = (count: number) => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
};

const normalizeDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function ContributionHeatmap({ data = [] }: ContributionHeatmapProps) {


  // Transform prop data to map for easy lookup
  const contributionsMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(item => {
      map.set(normalizeDate(item.date), item.count);
    });
    return map;
  }, [data]);

  // Generate calendar dates (last 365 days)
  const { calendarDates, weeks } = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 365);

    // Normalize to Sunday start
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    for (let i = 0; i <= 371; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      if (date > today) break;
      dates.push(date);
    }

    const weeksArr: Date[][] = [];
    let currentWeek: Date[] = [];

    dates.forEach((date) => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    return { calendarDates: dates, weeks: weeksArr };
  }, []);

  // Stats Calculation
  const totalSubmissions = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  const activeDays = useMemo(() => {
    return data.filter(d => d.count > 0).length;
  }, [data]);

  const maxStreak = useMemo(() => {
    let max = 0;
    let current = 0;

    // Sort data by date just in case
    const sortedData = [...data]
      .filter(d => d.count > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedData.length === 0) return 0;

    let prevDate = new Date(sortedData[0].date);
    // Initialize streak with 1 as we have at least one active day
    current = 1;
    max = 1;

    for (let i = 1; i < sortedData.length; i++) {
      const currentDate = new Date(sortedData[i].date);
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current += 1;
      } else if (diffDays > 1) {
        current = 1;
      }

      if (current > max) max = current;
      prevDate = currentDate;
    }

    return max;
  }, [data]);



  return (
    <div className={cn("w-full rounded-md border p-4 shadow-sm font-sans", THEME.bg, THEME.border)}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-medium", THEME.textMain)}>
            {totalSubmissions} submissions
          </span>
          <span className={cn("text-sm", THEME.textMuted)}>in the past one year</span>
          <Info size={14} className={THEME.textMuted} />
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className={THEME.textMuted}>
            Total active days: <span className={THEME.textMain}>{activeDays}</span>
          </div>
          <div className={THEME.textMuted}>
            Max streak: <span className={THEME.textMain}>{maxStreak}</span>
          </div>

          {/* Year Dropdown */}
          <button className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            "bg-muted/50 border text-muted-foreground hover:border-foreground/20 hover:text-foreground", THEME.border)}>
            Current <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Heatmap Grid Wrapper */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">

          {/* Day Labels (Mon, Wed, Fri) */}
          <div className="flex flex-col gap-1 pt-6 pr-2">
            {/* Spacer for month labels row */}
            <div className="h-0" />
            {/* 7 rows, specific labels only */}
            {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
              <div key={dayIndex} className="h-[10px] text-[9px] leading-[10px] text-muted-foreground relative">
                {dayIndex === 1 && 'Mon'}
                {dayIndex === 3 && 'Wed'}
                {dayIndex === 5 && 'Fri'}
              </div>
            ))}
          </div>

          {/* The Grid Columns (Weeks) */}
          {weeks.map((week, weekIndex) => {
            // Determine if we should show a month label above this week
            const firstDay = week[0];
            const isNewMonth = firstDay.getDate() <= 7;
            const monthLabel = isNewMonth ? MONTH_LABELS[firstDay.getMonth()] : null;

            return (
              <div key={weekIndex} className="flex flex-col gap-1">
                {/* Month Label Row */}
                <div className="h-[14px] text-[9px] text-muted-foreground mb-1">
                  {monthLabel}
                </div>

                {/* Days in this week */}
                {week.map((date) => {
                  const dateKey = normalizeDate(date);
                  const count = contributionsMap.get(dateKey) || 0;
                  const level = getContributionLevel(count);

                  return (
                    <div
                      key={dateKey}
                      title={`${count} submissions on ${date.toDateString()}`}
                      className={cn(
                        "w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-colors duration-200 border border-border/10 hover:ring-1 hover:ring-foreground/40 hover:z-10",
                        THEME.colors[level]
                      )}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Legend */}
      <div className="mt-4 flex items-center justify-end text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Less</span>
          {THEME.colors.map((color, i) => (
            <div key={i} className={cn("w-[10px] h-[10px] rounded-[2px] border border-border/10", color)} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
