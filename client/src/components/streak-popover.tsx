import { Flame, Calendar as CalendarIcon, Trophy, Target } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function StreakPopover() {
  const { data: userProfile } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/profile");
      return response.json();
    },
  });

  // Align with backend fields
  const currentStreak = userProfile?.streak ?? 0;
  const longestStreak = userProfile?.maxStreak ?? 0;
  const streakGoal = userProfile?.streakGoal ?? 7;
  // No totalDaysActive from API; approximate with currentStreak for now
  const totalDaysActive = userProfile?.streak ?? 0;

  // Generate mini calendar for last 30 days
  const generateCalendar = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const isActive = i < currentStreak; // Simplified - you can enhance this with actual data
      days.push({
        date: date.getDate(),
        isActive,
        isToday: i === 0,
      });
    }
    return days;
  };

  const calendarDays = generateCalendar();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group hover:bg-orange-500/10 transition-all duration-300"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Flame className="h-5 w-5 text-orange-500" />
          </motion.div>
          {currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {currentStreak}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-orange-200/50 dark:border-orange-800/30" align="end">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Streak Stats</h3>
                <p className="text-xs text-muted-foreground">Keep the fire burning!</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/10 border border-orange-200/50 dark:border-orange-800/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium text-muted-foreground">Current</span>
              </div>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/50 dark:border-purple-800/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Longest</span>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/50 dark:border-blue-800/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Goal</span>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{streakGoal}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/50 dark:border-green-800/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-black text-green-600 dark:text-green-400">{totalDaysActive}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </motion.div>
          </div>

          {/* Mini Calendar */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Last 30 Days
            </h4>
            <div className="grid grid-cols-10 gap-1">
              {calendarDays.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.2 }}
                  className={`
                    aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium
                    transition-all duration-200
                    ${day.isActive 
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md' 
                      : 'bg-secondary/50 text-muted-foreground'
                    }
                    ${day.isToday ? 'ring-2 ring-orange-500 ring-offset-1' : ''}
                  `}
                  title={`Day ${day.date}`}
                >
                  {day.isActive && <Flame className="h-2 w-2" />}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress to Goal */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress to Goal</span>
              <Badge variant="secondary" className="text-xs">
                {Math.round((currentStreak / streakGoal) * 100)}%
              </Badge>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((currentStreak / streakGoal) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"
              />
            </div>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
