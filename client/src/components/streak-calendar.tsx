import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface StreakCalendarProps {
  streak: number;
  streakGoal: number;
}

export function StreakCalendar({ streak, streakGoal }: StreakCalendarProps) {
  // Get current week days
  const getDaysOfWeek = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Convert Sunday=0 to Sunday=6
    
    return days.map((day, index) => ({
      label: day,
      isActive: index < streak && index <= adjustedToday,
      isToday: index === adjustedToday,
    }));
  };

  const days = getDaysOfWeek();
  const isOnFire = streak >= streakGoal;

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className={`h-4 w-4 ${isOnFire ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
          <span>Streak Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Streak Count */}
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">
              {streak}
            </div>
            <div className="text-xs text-muted-foreground">
              {streak === 1 ? 'day streak' : 'days streak'}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex justify-center gap-2">
            {days.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="text-xs text-muted-foreground font-medium">
                  {day.label}
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    day.isActive
                      ? day.isToday
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white ring-2 ring-orange-500 ring-offset-2 ring-offset-background scale-110'
                        : 'bg-gradient-to-br from-orange-400 to-red-400 text-white'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {day.isActive && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Motivational Message */}
          {isOnFire && (
            <div className="text-center text-xs text-orange-600 dark:text-orange-400 font-medium animate-pulse">
              🔥 You're on fire! Keep it going!
            </div>
          )}
          {streak === 0 && (
            <div className="text-center text-xs text-muted-foreground">
              Start your streak by solving a problem today!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
