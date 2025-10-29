import { Bell, CheckCircle, Trophy, Flame, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { QuestionWithDetails } from "@shared/schema";

interface Notification {
  id: string;
  type: "achievement" | "streak" | "contest" | "reminder";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationPopover() {
  const { data: userProfile } = useQuery<any>({ queryKey: ["/api/user/profile"] });
  const { data: todos = [] } = useQuery<any[]>({ queryKey: ["/api/todos"] });
  const { data: contests = [] } = useQuery<any[]>({ queryKey: ["/api/contests"] });
  const { data: questions = [] } = useQuery<QuestionWithDetails[]>({ queryKey: ["/api/questions"] });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const toTimestamp = (value: QuestionWithDetails["dateSaved"]) => {
    if (!value) return 0;
    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const sortedQuestions = [...questions].sort(
    (a, b) => toTimestamp(b.dateSaved) - toTimestamp(a.dateSaved)
  );

  const questionsToday = sortedQuestions.filter((q) => {
    const ds = q.dateSaved ? new Date(q.dateSaved as unknown as string) : null;
    if (!ds) return false;
    const dm = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate());
    return dm.getTime() === today.getTime();
  }).length;

  const pendingTodos = todos.filter((t: any) => !t.completed).length;
  const currentStreak = userProfile?.streak ?? 0;
  const streakGoal = userProfile?.streakGoal ?? 7;

  const notifications: Notification[] = [];
  const latestQuestion = sortedQuestions[0];
  if (latestQuestion?.dateSaved) {
    const latestDate = new Date(latestQuestion.dateSaved as unknown as string);
    const diffMs = now.getTime() - latestDate.getTime();
    if (!Number.isNaN(diffMs) && diffMs >= 0 && diffMs <= 1000 * 60 * 60) {
      const relative =
        diffMs < 1000 * 60
          ? "Just now"
          : diffMs < 1000 * 60 * 60
            ? `${Math.round(diffMs / (1000 * 60))} min ago`
            : latestDate.toLocaleTimeString();
      notifications.push({
        id: `question_${latestQuestion.id}`,
        type: "achievement",
        title: "New question saved",
        message: latestQuestion.title,
        time: relative,
        read: false,
      });
    }
  }

  if (questionsToday > 0) {
    notifications.push({
      id: "q_today",
      type: "achievement",
      title: "Nice work today",
      message: `${questionsToday} problem${questionsToday === 1 ? '' : 's'} added today`,
      time: "Just now",
      read: false,
    });
  }
  if (currentStreak > 0) {
    notifications.push({
      id: "streak_current",
      type: "streak",
      title: "Streak running",
      message: `You're on a ${currentStreak}-day streak (goal ${streakGoal})`,
      time: "Today",
      read: false,
    });
  }
  if (pendingTodos > 0) {
    notifications.push({
      id: "todos_pending",
      type: "reminder",
      title: "Tasks pending",
      message: `${pendingTodos} to-do item${pendingTodos === 1 ? '' : 's'} remaining`,
      time: "Today",
      read: false,
    });
  }
  if (contests.length > 0) {
    notifications.push({
      id: "contest_upcoming",
      type: "contest",
      title: "Upcoming contest",
      message: `${contests[0].name} on ${contests[0].platform}`,
      time: contests[0].startTime || "Soon",
      read: true,
    });
  }

  const unreadCount = notifications.length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "achievement":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "streak":
        return <Flame className="h-4 w-4 text-orange-500" />;
      case "contest":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "reminder":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group hover:bg-blue-500/10 transition-all duration-300"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -15, 15, -15, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Bell className="h-5 w-5 text-blue-500" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className={
                      `p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ` +
                      (notification.read
                        ? 'bg-secondary/30 hover:bg-secondary/50'
                        : 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30')
                    }
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {notification.time}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
