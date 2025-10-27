import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ConsistencyScoreCardProps {
  currentStreak: number;
  maxStreak: number;
  activeDaysLast30: number;
  daysSinceLastActivity: number;
}

export function ConsistencyScoreCard({
  currentStreak,
  maxStreak,
  activeDaysLast30,
  daysSinceLastActivity,
}: ConsistencyScoreCardProps) {
  // Calculate Consistency Score
  const streakFactor = maxStreak > 0 ? (currentStreak / maxStreak) * 100 : 0;
  const activityFrequency = (activeDaysLast30 / 30) * 100;
  const recencyFactor = Math.max(0, Math.min(100, 100 - (daysSinceLastActivity * 10)));
  
  const consistencyScore = (
    (streakFactor * 0.4) + 
    (activityFrequency * 0.4) + 
    (recencyFactor * 0.2)
  ).toFixed(1);

  const score = parseFloat(consistencyScore);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = () => {
    if (score >= 80) return 'from-green-400 to-emerald-600';
    if (score >= 60) return 'from-blue-400 to-blue-600';
    if (score >= 40) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Consistency Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-secondary"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`${getScoreGradient().split(' ')[0].replace('from-', 'text-')}`} stopColor="currentColor" />
                <stop offset="100%" className={`${getScoreGradient().split(' ')[1].replace('to-', 'text-')}`} stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold ${getScoreColor()}`}>{consistencyScore}%</div>
            <div className="text-xs text-muted-foreground mt-1">Consistency</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6 w-full">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{streakFactor.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{activityFrequency.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Activity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{recencyFactor.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Recency</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
