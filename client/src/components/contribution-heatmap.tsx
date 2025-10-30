import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ContributionHeatmapProps {
  data?: Array<{ date: string; count: number }>;
}

interface HeatmapDay {
  date: Date;
  count: number;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL_SIZE = 12;
const CELL_GAP = 2;
const LABEL_WIDTH = 32;
const MONTH_LABEL_HEIGHT = 16;

const normalizeDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTooltip = (date: Date, count: number) => {
  const base = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${base}: ${Math.max(count, 0)} problem${Math.max(count, 0) === 1 ? "" : "s"}`;
};

export function ContributionHeatmap({ data = [] }: ContributionHeatmapProps) {
  const { weeks, totalContributions, hasActivity, monthPositions } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const contributions = new Map<string, number>();
    data.forEach(({ date, count }) => {
      const key = normalizeDate(date);
      contributions.set(key, (contributions.get(key) || 0) + count);
    });

    const totalWeeks = 53;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalWeeks * 7);
    startDate.setHours(0, 0, 0, 0);

    const startOffset = startDate.getDay();
    startDate.setDate(startDate.getDate() - startOffset);

    const generatedWeeks: HeatmapDay[][] = [];
    const monthLabels: Array<{ label: string; weekIndex: number }> = [];
    let runningDate = new Date(startDate);
    let contributionsSum = 0;
    let hasNonZeroActivity = false;

    for (let week = 0; week < totalWeeks; week++) {
      const weekData: HeatmapDay[] = [];

      for (let day = 0; day < 7; day++) {
        const current = new Date(runningDate);
        const key = normalizeDate(current);
        const isFuture = current > today;
        const count = isFuture ? -1 : contributions.get(key) ?? 0;

        if (!isFuture) {
          contributionsSum += Math.max(count, 0);
          if (count > 0) {
            hasNonZeroActivity = true;
          }
        }

        weekData.push({ date: current, count });
        runningDate.setDate(runningDate.getDate() + 1);
      }

      const firstDay = weekData[0]?.date;
      if (firstDay && firstDay.getDate() <= 7) {
        monthLabels.push({
          label: MONTH_LABELS[firstDay.getMonth()],
          weekIndex: week,
        });
      }

      generatedWeeks.push(weekData);
      if (runningDate > today && runningDate.getDay() === 0) {
        break;
      }
    }

    return {
      weeks: generatedWeeks,
      totalContributions: contributionsSum,
      hasActivity: hasNonZeroActivity,
      monthPositions: monthLabels,
    };
  }, [data]);

  const heatmapWidth = weeks.length * (CELL_SIZE + CELL_GAP) - CELL_GAP + LABEL_WIDTH;
  const heatmapHeight = 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP + MONTH_LABEL_HEIGHT;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth;
      if (!availableWidth) return;
      const requiredWidth = heatmapWidth;
      const nextScale = requiredWidth > availableWidth ? availableWidth / requiredWidth : 1;
      setScale(Math.max(Math.min(nextScale, 1), 0.5));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [heatmapWidth]);

  const getColor = (count: number) => {
    if (count === -1) return "bg-transparent border border-dashed border-border/40";
    if (count === 0) return "bg-slate-300/60 dark:bg-slate-700/60";
    if (count === 1) return "bg-emerald-200 dark:bg-emerald-900/60";
    if (count === 2) return "bg-emerald-300 dark:bg-emerald-800/70";
    if (count === 3) return "bg-emerald-400 dark:bg-emerald-700/80";
    return "bg-emerald-500 dark:bg-emerald-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-500" />
          Activity Heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalContributions} contributions in the last year
        </p>
      </CardHeader>
      <CardContent>
        {weeks.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            No activity data available yet.
          </div>
        ) : (
          <div className="space-y-3">
            <div
              ref={containerRef}
              className="relative max-w-full min-w-0 overflow-hidden rounded-2xl border border-border/40 bg-muted/10 p-4"
            >
              <div
                style={{ height: heatmapHeight * scale, width: heatmapWidth * scale }}
                className="relative"
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: heatmapWidth,
                  }}
                  className="flex flex-col gap-2"
                >
                  <div
                    className="flex gap-[2px]"
                    style={{ paddingLeft: LABEL_WIDTH }}
                  >
                    {monthPositions.map(({ label, weekIndex }) => (
                      <div
                        key={`${label}-${weekIndex}`}
                        className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                        style={{ marginLeft: weekIndex === 0 ? 0 : weekIndex * (CELL_SIZE + CELL_GAP) }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-[2px]">
                    <div
                      className="flex flex-col justify-between pr-2 text-[10px] text-muted-foreground"
                      style={{ width: LABEL_WIDTH }}
                    >
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                    </div>
                    <div className="flex gap-[2px]">
                      {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[2px]">
                          {week.map((day, dayIndex) => (
                            <div
                              key={`${weekIndex}-${dayIndex}`}
                              style={{ width: CELL_SIZE, height: CELL_SIZE }}
                              className={`rounded-[3px] transition-all duration-150 ${getColor(day.count)} ${
                                day.count > 0 ? "shadow-sm" : ""
                              } ${day.count >= 0 ? "hover:scale-105 cursor-pointer" : "cursor-default opacity-40"}`}
                              title={day.count >= 0 ? formatTooltip(day.date, day.count) : undefined}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!hasActivity && (
              <div className="text-xs text-muted-foreground">
                No recorded problem activity yet. Add questions to start building your streak.
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-300/60 dark:bg-slate-700/60" />
                <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/60" />
                <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-800/70" />
                <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/80" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
              </div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
