import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useMemo } from "react";

interface ContributionHeatmapProps {
  data?: Array<{ date: string; count: number }>;
}

interface HeatmapDay {
  date: Date;
  count: number;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const normalizeDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTooltip = (date: Date, count: number) => {
  return `${date.toLocaleDateString()}: ${count >= 0 ? count : 0} problems`;
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

    // Generate 53 weeks to keep a rolling year view similar to GitHub
    const totalWeeks = 53;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalWeeks * 7);
    startDate.setHours(0, 0, 0, 0);

    // Align start date to the previous Sunday
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

  const getColor = (count: number) => {
    if (count === -1) return "bg-transparent";
    if (count === 0) return "bg-muted/30";
    if (count === 1) return "bg-green-200 dark:bg-green-900/40";
    if (count === 2) return "bg-green-300 dark:bg-green-800/60";
    if (count === 3) return "bg-green-400 dark:bg-green-700/80";
    return "bg-green-500 dark:bg-green-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
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
          <div className="space-y-2">
            <div className="flex gap-[2px] pl-6">
              {monthPositions.map(({ label, weekIndex }) => (
                <div
                  key={`${label}-${weekIndex}`}
                  className="text-xs text-muted-foreground"
                  style={{ marginLeft: weekIndex === 0 ? 0 : weekIndex * 10 }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex gap-[2px]">
              <div className="flex flex-col gap-[2px] justify-around text-xs text-muted-foreground pr-1">
                <div>Mon</div>
                <div></div>
                <div>Wed</div>
                <div></div>
                <div>Fri</div>
                <div></div>
                <div></div>
              </div>

              <div className="flex gap-[2px] flex-1 overflow-x-auto pb-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px]">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`h-3 w-3 rounded-sm ${getColor(day.count)} ${
                          day.count >= 0 ? "hover:ring-2 hover:ring-green-500 cursor-pointer transition-all" : "cursor-default"
                        }`}
                        title={formatTooltip(day.date, day.count)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {!hasActivity && (
              <div className="text-xs text-muted-foreground pt-2">
                No recorded problem activity yet. Add questions to start building your streak.
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
                <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800/60" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/80" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
              </div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
