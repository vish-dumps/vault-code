import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Zap, Focus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DayStat {
  date: string;
  added: number;
  completed: number;
}

interface ProductivityMetricsCardProps {
  tasksAddedDaily: number;
  tasksCompletedDaily: number;
  totalTasks: number;
  consistencyScore: number;
  historicalStats: DayStat[];
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatDateLabel = (isoDate?: string) => {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function ProductivityMetricsCard({
  tasksAddedDaily,
  tasksCompletedDaily,
  totalTasks,
  consistencyScore,
  historicalStats,
}: ProductivityMetricsCardProps) {
  const [selectedMetricIndex, setSelectedMetricIndex] = useState<number | null>(null);

  const {
    completionRate,
    dailyProductivityScore,
    engagementRatio,
    focusIndex,
    bestMetrics,
  } = useMemo(() => {
    const baseCompletion = tasksAddedDaily > 0 ? (tasksCompletedDaily / tasksAddedDaily) * 100 : 0;
    const baseEngagement = totalTasks > 0 ? (tasksCompletedDaily / totalTasks) * 100 : 0;
    const baseProductivity = tasksCompletedDaily - (tasksAddedDaily - tasksCompletedDaily);
    const baseFocus = (baseCompletion / 100) * consistencyScore;

    let bestCompletion = { value: baseCompletion, date: historicalStats.at(-1)?.date };
    let bestProductivity = { value: baseProductivity, date: historicalStats.at(-1)?.date };
    let bestEngagement = { value: baseEngagement, date: historicalStats.at(-1)?.date };
    let bestFocus = { value: baseFocus, date: historicalStats.at(-1)?.date };

    historicalStats.forEach(({ date, added, completed }) => {
      const completion = added > 0 ? (completed / added) * 100 : 0;
      const productivity = completed - (added - completed);
      const engagement = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
      const focus = (completion / 100) * consistencyScore;

      if (completion > bestCompletion.value) bestCompletion = { value: completion, date };
      if (productivity > bestProductivity.value) bestProductivity = { value: productivity, date };
      if (engagement > bestEngagement.value) bestEngagement = { value: engagement, date };
      if (focus > bestFocus.value) bestFocus = { value: focus, date };
    });

    return {
      completionRate: formatPercent(baseCompletion),
      dailyProductivityScore: baseProductivity.toFixed(1),
      engagementRatio: formatPercent(baseEngagement),
      focusIndex: baseFocus.toFixed(1),
      bestMetrics: {
        completionRate: bestCompletion,
        productivity: bestProductivity,
        engagement: bestEngagement,
        focus: bestFocus,
      },
    };
  }, [tasksAddedDaily, tasksCompletedDaily, totalTasks, consistencyScore, historicalStats]);

  const metrics = [
    {
      icon: Target,
      label: "Completion Rate",
      value: `${completionRate}`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "Measures what percentage of tasks created today were completed.",
      calculation: "Completed today / Created today * 100",
      best: bestMetrics.completionRate,
      meaning:
        "Higher completion rate indicates tighter execution and fewer unfinished tasks rolling over.",
    },
    {
      icon: Activity,
      label: "Productivity Score",
      value: dailyProductivityScore,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description:
        "A momentum score that rewards completed tasks and penalises unfinished ones created today.",
      calculation: "Completed today - (Created today - Completed today)",
      best: bestMetrics.productivity,
      meaning:
        "Positive scores mean you're finishing more than you start. Negative scores show growing backlog.",
    },
    {
      icon: Zap,
      label: "Engagement Ratio",
      value: `${engagementRatio}`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description:
        "Shows how many of your total tasks moved forward today, indicating breadth of activity.",
      calculation: "Completed today / All tasks * 100",
      best: bestMetrics.engagement,
      meaning:
        "Consistent engagement keeps long-running tasks from stagnating and highlights steady progress.",
    },
    {
      icon: Focus,
      label: "Focus Index",
      value: focusIndex,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description:
        "Blends today's completion discipline with your broader consistency score to highlight focus.",
      calculation: "Completion Rate * Consistency Score",
      best: bestMetrics.focus,
      meaning:
        "High focus index days combine disciplined execution with strong streak habits - your ideal target.",
    },
  ];

  const activeMetric = selectedMetricIndex !== null ? metrics[selectedMetricIndex] : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Productivity Metrics</CardTitle>
          <p className="text-xs text-muted-foreground">
            Click a metric to learn how it&apos;s calculated and see your best day.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
              <button
                key={metric.label}
                type="button"
                onClick={() => setSelectedMetricIndex(index)}
                className={`p-4 text-left rounded-lg ${metric.bgColor} border border-transparent hover:border-current transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-background ${metric.color}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedMetricIndex !== null} onOpenChange={() => setSelectedMetricIndex(null)}>
        {activeMetric && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{activeMetric.label}</DialogTitle>
              <DialogDescription>{activeMetric.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-foreground">How it&apos;s calculated:</span>
                <p className="text-muted-foreground">{activeMetric.calculation}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Today&apos;s value:</span>
                <p className="text-muted-foreground">{activeMetric.value}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Best so far:</span>
                <p className="text-muted-foreground">
                  {`${activeMetric.best.value.toFixed(1)} ${
                    activeMetric.label.includes("Rate") || activeMetric.label.includes("Ratio") ? "%" : ""
                  } on ${formatDateLabel(activeMetric.best.date)}`}
                </p>
              </div>
              <div>
                <span className="font-medium text-foreground">What it means:</span>
                <p className="text-muted-foreground">{activeMetric.meaning}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
