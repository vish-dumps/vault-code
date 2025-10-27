import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Zap, Focus } from "lucide-react";

interface ProductivityMetricsCardProps {
  tasksAddedDaily: number;
  tasksCompletedDaily: number;
  totalTasks: number;
  consistencyScore: number;
}

export function ProductivityMetricsCard({
  tasksAddedDaily,
  tasksCompletedDaily,
  totalTasks,
  consistencyScore,
}: ProductivityMetricsCardProps) {
  // Calculate metrics
  const completionRate = tasksAddedDaily > 0 
    ? ((tasksCompletedDaily / tasksAddedDaily) * 100).toFixed(1)
    : '0.0';
  
  const dailyProductivityScore = tasksCompletedDaily - (tasksAddedDaily - tasksCompletedDaily);
  
  const engagementRatio = totalTasks > 0 
    ? ((tasksCompletedDaily / totalTasks) * 100).toFixed(1)
    : '0.0';
  
  const focusIndex = ((parseFloat(completionRate) / 100) * consistencyScore).toFixed(1);

  const metrics = [
    {
      icon: Target,
      label: 'Completion Rate',
      value: `${completionRate}%`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Activity,
      label: 'Productivity Score',
      value: dailyProductivityScore.toString(),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Zap,
      label: 'Engagement Ratio',
      value: `${engagementRatio}%`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Focus,
      label: 'Focus Index',
      value: focusIndex,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daily Productivity Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${metric.bgColor} border border-transparent hover:border-current transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-background ${metric.color}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
