import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CheckCircle, Flame, TrendingUp, Plus, Code2, Trash2, CheckSquare, Square, Settings, GripVertical, Clock, Circle } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { StatsCardWithProgress } from "@/components/stats-card-with-progress";
import { ContestList } from "@/components/contest-list";
import { FloatingActionButton } from "@/components/floating-action-button";
import { MotivationQuote } from "@/components/motivation-quote";
import { GoalSettingsDialog } from "@/components/goal-settings-dialog";
import { StreakCalendar } from "@/components/streak-calendar";
import { WeeklyActivityGraph } from "@/components/weekly-activity-graph";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toTitleCase } from "@/lib/text";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { QuestionWithDetails, TopicProgress } from "@shared/schema";

interface Contest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  url: string;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  retainUntil?: string;
  createdAt: string;
  completedAt?: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [todoFilter, setTodoFilter] = useState<"all" | "active" | "completed">("active");
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalDialogType, setGoalDialogType] = useState<"daily" | "streak">("daily");

  // Fetch questions to calculate stats
  const { data: questions = [] } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/questions"],
    refetchInterval: 30000,
  });

  const { data: solvedAuto = [] } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/user/solved?limit=200"],
    refetchInterval: 60000,
  });

  // Fetch contests
  const {
    data: contests = [],
    isLoading: areContestsLoading,
    isError: contestsError,
    refetch: refetchContests,
  } = useQuery<Contest[]>({
    queryKey: ["/api/contests"],
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch topic progress
  const { data: topicProgress = [] } = useQuery<TopicProgress[]>({
    queryKey: ["/api/topics"],
    refetchInterval: 60000,
  });

  // Fetch todos
  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
    refetchInterval: 30000,
  });

  // Fetch user profile for streak and daily progress
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    refetchInterval: 10000, // Faster refresh for auto-tracked questions
  });

  const invalidateGamification = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/user/gamification"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
  }, []);

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async (data: { streakGoal?: number; dailyGoal?: number }) => {
      const response = await apiRequest("PATCH", "/api/user/goals", data);
      return response.json();
    },
    onSuccess: () => {
      invalidateGamification();
      toast({ title: "Success", description: "Goal updated successfully" });
    },
  });

  // Update streak on mount
  useEffect(() => {
    const updateStreak = async () => {
      try {
        await apiRequest("POST", "/api/user/update-streak");
        queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      } catch (error) {
        console.error("Failed to update streak:", error);
      }
    };
    updateStreak();
  }, []);

  // Add todo mutation
  const addTodoMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/todos", { title });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setNewTodoTitle("");
      invalidateGamification();
      toast({ title: "Success", description: "Todo added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add todo", variant: "destructive" });
    },
  });

  // Toggle todo mutation
  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/todos/${id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      invalidateGamification();
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      invalidateGamification();
      toast({ title: "Success", description: "Todo deleted successfully" });
    },
  });

  // Reorder todos mutation
  const reorderTodosMutation = useMutation({
    mutationFn: async (todoIds: string[]) => {
      await apiRequest("POST", "/api/todos/reorder", { todoIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  // Update todo retention mutation
  const updateRetentionMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number | null }) => {
      const retainUntil = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
      const response = await apiRequest("PATCH", `/api/todos/${id}`, { retainUntil });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      invalidateGamification();
      toast({ title: "Success", description: "Task retention updated" });
    },
  });

  // Calculate stats from questions
  const totalProblems = questions.length;
  const totalSolved = userProfile?.stats?.totalSolved ?? totalProblems;
  
  // Calculate top topic from actual question tags
  const getTopTopic = () => {
    if (topicProgress.length > 0) {
      const max = topicProgress.reduce((max: TopicProgress, curr: TopicProgress) => 
        (curr.solved || 0) > (max.solved || 0) ? curr : max
      );
      return max.topic;
    }
    
    // Fallback: count tags from questions
    const tagCounts: Record<string, number> = {};
    questions.forEach(q => {
      q.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const entries = Object.entries(tagCounts);
    if (entries.length === 0) return "No topics yet";
    
    const [topTag] = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
    return topTag;
  };
  
  const topTopic = getTopTopic();
  const topTopicCount = topicProgress.find(t => t.topic === topTopic)?.solved || 
    questions.filter(q => q.tags?.includes(topTopic)).length;

  const currentStreak = userProfile?.streak || 0;
  const streakGoal = userProfile?.streakGoal ?? 7;
  const dailyGoal = userProfile?.dailyGoal ?? 3;
  // Use dailyProgress from user profile which includes both manual and auto-tracked questions
  const dailyProgress = userProfile?.dailyProgress ?? 0;
  const hasStartedToday = dailyProgress > 0;
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursLeftInDay = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isLateWarning = !hasStartedToday && hoursLeftInDay <= 4;
  const streakGradientStops = isLateWarning
    ? { start: "#fb7185", mid: "#f43f5e", end: "#e11d48" }
    : hasStartedToday
    ? { start: "#f97316", mid: "#ea580c", end: "#dc2626" }
    : { start: "#a1a1aa", mid: "#6b7280", end: "#4b5563" };
  const fireGradientStops = isLateWarning
    ? { start: "#fb7185", mid: "#f43f5e", end: "#e11d48" }
    : hasStartedToday
    ? { start: "#f97316", mid: "#ea580c", end: "#dc2626" }
    : { start: "#cbd5f5", mid: "#94a3b8", end: "#64748b" };
  const streakLabelColor = isLateWarning
    ? "text-rose-600 dark:text-rose-400"
    : hasStartedToday
    ? "text-orange-600 dark:text-orange-400"
    : "text-muted-foreground";
  const streakGlowClass = isLateWarning
    ? "from-rose-500/20 to-red-500/20"
    : hasStartedToday
    ? "from-orange-400/15 to-red-400/15"
    : "from-slate-400/20 to-slate-500/20";
  const streakCardClass = [
    "group hover:shadow-2xl transition-all duration-300 border h-full overflow-hidden relative",
    isLateWarning
      ? "bg-gradient-to-br from-rose-50 to-red-100/70 dark:from-rose-950/20 dark:to-red-900/20 border-rose-200/60 dark:border-rose-800/40"
      : hasStartedToday
      ? "bg-gradient-to-br from-orange-50 to-red-50/50 dark:from-orange-950/20 dark:to-red-900/10 border-orange-200/50 dark:border-orange-800/30"
      : "bg-gradient-to-br from-slate-100 to-slate-200/70 dark:from-slate-900/60 dark:to-slate-800/40 border-slate-200/60 dark:border-slate-700/40",
  ].join(" ");
  const streakStatusMessage = hasStartedToday
    ? `${currentStreak}/${streakGoal} goal • ${streakGoal > 0 ? Math.round(Math.min((currentStreak / streakGoal) * 100, 100)) : 0}%`
    : isLateWarning
    ? "Finish a problem before midnight to keep your streak!"
    : "Save your streak — log today's first problem.";
  const streakRingBackground = isLateWarning
    ? "text-rose-200/40 dark:text-rose-900/30"
    : hasStartedToday
    ? "text-orange-200/30 dark:text-orange-900/30"
    : "text-slate-300/50 dark:text-slate-700/60";

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (todoFilter === "active") return !todo.completed;
    if (todoFilter === "completed") return todo.completed;
    return true;
  });

  const activeTodosCount = todos.filter(t => !t.completed).length;
  const completedTodosCount = todos.filter(t => t.completed).length;

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim()) {
      addTodoMutation.mutate(newTodoTitle.trim());
    }
  };

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodo(todoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetTodoId: string) => {
    e.preventDefault();
    if (!draggedTodo || draggedTodo === targetTodoId) return;

    const draggedIndex = filteredTodos.findIndex(t => t.id === draggedTodo);
    const targetIndex = filteredTodos.findIndex(t => t.id === targetTodoId);

    const newTodos = [...filteredTodos];
    const [removed] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(targetIndex, 0, removed);

    const todoIds = newTodos.map(t => t.id);
    reorderTodosMutation.mutate(todoIds);
    setDraggedTodo(null);
  };

  const handleDragEnd = () => {
    setDraggedTodo(null);
  };

  // Generate weekly activity data from real questions (Mon-Sun of current week)
  const weeklyData = useMemo(() => {
    const startOfWeek = (() => {
      const d = new Date();
      // JS getDay(): Sun=0..Sat=6; we want Mon=0..Sun=6
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1 - day); // move to Monday
      const monday = new Date(d);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(d.getDate() + diff);
      return monday;
    })();

    const counts = Array(7).fill(0) as number[]; // Mon..Sun
    const seen = new Set<string>();
    const combinedEntries = [...questions, ...solvedAuto];

    for (const entry of combinedEntries) {
      const sourceDate = (entry as any).solvedAt ?? entry.dateSaved;
      if (!sourceDate) continue;
      const solvedDate = sourceDate instanceof Date ? sourceDate : new Date(sourceDate as any);
      if (Number.isNaN(solvedDate.getTime())) continue;
      const dayFloor = new Date(solvedDate.getFullYear(), solvedDate.getMonth(), solvedDate.getDate());
      if (dayFloor < startOfWeek) continue;
      const idx = solvedDate.getDay() === 0 ? 6 : solvedDate.getDay() - 1;
      const titleSeed = (entry.title ?? "").toString().trim() || "untitled";
      const idSeed = (entry as any).problemId ?? entry.id ?? `${titleSeed}-${idx}`;
      const key = `${idSeed}-${dayFloor.getTime()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      counts[idx] += 1;
    }

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, i) => ({ day: label, problems: counts[i] }));
  }, [questions, solvedAuto]);
  const motivationalQuotes = [
    "The only way to do great work is to love what you do.",
    "Code is like humor. When you have to explain it, it's bad.",
    "First, solve the problem. Then, write the code.",
    "Experience is the name everyone gives to their mistakes.",
    "The best error message is the one that never shows up.",
  ];
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const formattedName = useMemo(() => {
    if (user?.name && user.name.trim().length > 0) {
      return toTitleCase(user.name);
    }
    return user?.username || "Coder";
  }, [user?.name, user?.username]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/10 p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 flex-shrink-0"
      >
        <div className="text-sm font-medium text-muted-foreground mb-1">Welcome Back,</div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-2">
          <span className="bg-gradient-to-r from-[#d397fa] via-[#a78bfa] to-[#8364e8] bg-clip-text text-transparent animate-gradient">
            {formattedName}
          </span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">Let&rsquo;s make today count. Keep building your coding skills!</p>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Left: 4 Stats Cards in 2x2 Grid - Fixed Size */}
        <div className="lg:col-span-1 min-h-0">
          <div className="grid grid-cols-2 gap-3 h-full">
            {/* Problems Solved - Square with Circular Progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="h-full"
            >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 group hover:shadow-2xl transition-all duration-300 border-green-200/50 dark:border-green-800/30 h-full">
                  <CardContent className="p-4 h-full flex flex-col items-center justify-between">
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-medium">Problems</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setGoalDialogType("daily");
                      setGoalDialogOpen(true);
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-secondary" />
                    <circle
                      cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"
                      className="text-green-500"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(dailyProgress / dailyGoal, 1))}`}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dailyProgress}</div>
                    <div className="text-xs text-muted-foreground">of {dailyGoal}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center font-medium">Today's progress</div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Today: {dailyProgress} of {dailyGoal}</div>
                  <div>Total saved: {totalProblems}</div>
                </div>
              </TooltipContent>
            </Tooltip>
            </motion.div>

            {/* Streak - Square with Circular Progress Around Fire Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="h-full"
            >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={streakCardClass}>
              {/* Animated background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${streakGlowClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-4 h-full flex flex-col justify-between relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${streakLabelColor}`}>Streak</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setGoalDialogType("streak");
                      setGoalDialogOpen(true);
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-center flex-1 flex flex-col justify-center items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Circular Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="44" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none" 
                        className={streakRingBackground} 
                      />
                      <motion.circle
                        initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - Math.min(currentStreak / streakGoal, 1)) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        cx="48" 
                        cy="48" 
                        r="44" 
                        stroke="url(#streakGradient)" 
                        strokeWidth="4" 
                        fill="none" 
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        className="drop-shadow-lg"
                      />
                      <defs>
                        <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={streakGradientStops.start} />
                          <stop offset="50%" stopColor={streakGradientStops.mid} />
                          <stop offset="100%" stopColor={streakGradientStops.end} />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Fire Logo with Negative Space Text */}
                    <div className="relative w-16 h-16">
                      <svg
                        viewBox="0 0 490 522"
                        className={`w-full h-full ${currentStreak >= streakGoal ? 'animate-pulse' : ''} ${isLateWarning ? 'animate-[pulse_1.4s_ease-in-out_infinite]' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={fireGradientStops.start} />
                            <stop offset="50%" stopColor={fireGradientStops.mid} />
                            <stop offset="100%" stopColor={fireGradientStops.end} />
                          </linearGradient>
                          <mask id="textMask">
                            <rect width="490" height="522" fill="white" />
                            <text 
                              x="245" 
                              y="340" 
                              fontSize="200" 
                              fontWeight="900" 
                              textAnchor="middle" 
                              fill="black"
                              fontFamily="system-ui, -apple-system, sans-serif"
                            >
                              {currentStreak}
                            </text>
                          </mask>
                        </defs>
                        <path 
                          fill="url(#fireGradient)" 
                          mask="url(#textMask)"
                          d="M72.72,418.38c-20.9-41.31-26.52-92.22-19.86-135.61,5.72-37.26,26.02-88.2,63.49-107.32,16.68-8.51,10.55,18.38,10.55,18.38,0,0-5.11,58.55,11.57,72.17,14.98-80.34,62.98-100.09,73.87-135.49s9.53-50.8-16.68-81.36c-12.26-15.32,27.57-11.23,27.57-11.23,0,0,102.81,7.15,114.72,116.43,7.49,63.66-11.91,63.66-5.79,102.81,6.13,39.15,36.77,21.11,43.24,12.93,7.75-9.8,12.54-31.92,25.86-13.27,38.57,53.99,39.54,128.58-.53,182.01-38.43,51.24-104.52,77.51-167.63,74.36-16.85-.84-33.6-3.84-49.61-9.21-25.93-8.69-51.95-19.72-73.16-37.34-15.8-13.12-28.25-29.73-37.63-48.26Z" 
                        />
                      </svg>
                    </div>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`text-xs mt-1 font-medium ${hasStartedToday ? 'text-muted-foreground' : isLateWarning ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground'}`}
                  >
                    {currentStreak === 1 ? 'day' : 'days'}
                  </motion.div>
                </div>
                <div className={`text-[10px] text-center font-medium ${hasStartedToday ? 'text-muted-foreground' : isLateWarning ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground'}`}>
                  {streakStatusMessage}
                </div>
              </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Current: {currentStreak} days</div>
                  <div>Goal: {streakGoal} days</div>
                  {!hasStartedToday && (
                    <div>Time left today: ~{Math.max(0, Math.ceil(hoursLeftInDay))}h</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
            </motion.div>

            {/* Top Topic - Square */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="h-full"
            >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 hover:shadow-2xl transition-all duration-300 border-blue-200/50 dark:border-blue-800/30 h-full">
                  <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                <TrendingUp className="h-6 w-6 text-blue-500 mb-2" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 truncate max-w-full">{topTopic}</div>
                <p className="text-xs font-semibold mt-1">Top Topic</p>
                <p className="text-xs text-muted-foreground font-medium">{topTopicCount > 0 ? `${topTopicCount} solved` : 'Start solving!'}</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">Based on tags in your saved problems</div>
              </TooltipContent>
            </Tooltip>
            </motion.div>

            {/* Questions Solved - Square */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="h-full"
            >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 hover:shadow-2xl transition-all duration-300 border-emerald-200/50 dark:border-emerald-800/30 h-full">
                  <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalSolved}</div>
                <p className="text-xs font-semibold mt-1">Questions Solved</p>
                <p className="text-xs text-muted-foreground font-medium">All time</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">Lifetime total of completed questions</div>
              </TooltipContent>
            </Tooltip>
            </motion.div>
          </div>
        </div>

        {/* Middle: Contests */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-1 h-full overflow-hidden min-h-0"
        >
          <ContestList
            contests={contests}
            isLoading={areContestsLoading}
            isError={contestsError}
            onRetry={() => refetchContests()}
          />
        </motion.div>

        {/* Right: TODO List - Full Height Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2 lg:row-span-1 h-full min-h-0"
        >
        <Card className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/10 dark:to-blue-950/10 border-cyan-200/50 dark:border-cyan-800/30 shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-2 flex-shrink-0 border-b border-cyan-200/30 dark:border-cyan-800/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-cyan-500" />
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent font-bold">To-Do List</span>
                {todos.length > 0 && <Badge variant="secondary" className="ml-2 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">{Math.round((completedTodosCount / todos.length) * 100)}%</Badge>}
              </CardTitle>
            </div>
            {todos.length > 0 && (
              <div className="mt-2 relative h-2 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-teal-500 to-cyan-600 transition-all duration-500 shadow-sm" style={{ width: `${(completedTodosCount / todos.length) * 100}%` }} />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2 flex-1 flex flex-col overflow-hidden pt-3">
            <form onSubmit={handleAddTodo} className="flex gap-2 flex-shrink-0">
              <Input placeholder="Add a new task..." value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)} className="h-8 text-sm bg-white/50 dark:bg-slate-900/50 border-cyan-200 dark:border-cyan-800/30 focus-visible:ring-cyan-500" />
              <Button type="submit" disabled={!newTodoTitle.trim()} size="sm" className="h-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"><Plus className="h-3 w-3" /></Button>
            </form>
            <Tabs value={todoFilter} onValueChange={(v) => setTodoFilter(v as any)} className="flex-shrink-0 w-full">
              <TabsList className="grid w-full grid-cols-3 h-8 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-cyan-200/50 dark:border-cyan-800/40 overflow-hidden">
                <TabsTrigger value="all" className="text-xs w-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">All</TabsTrigger>
                <TabsTrigger value="active" className="text-xs w-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Active</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs w-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Done</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 mt-1">
              {filteredTodos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {todoFilter === "completed" ? "No completed tasks" : todoFilter === "active" ? "No tasks yet. Start your day strong 💪" : "No tasks yet"}
                </p>
              ) : (
                filteredTodos.map((todo) => (
                  <div 
                    key={todo.id} 
                    draggable={!todo.completed}
                    onDragStart={(e) => !todo.completed && handleDragStart(e, todo.id)}
                    onDragOver={(e) => !todo.completed && handleDragOver(e)}
                    onDrop={(e) => !todo.completed && handleDrop(e, todo.id)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 ${
                      draggedTodo === todo.id ? 'opacity-50 scale-105' : ''
                    } ${!todo.completed ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    {!todo.completed && (
                      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                    <button 
                      onClick={() => toggleTodoMutation.mutate({ id: todo.id, completed: !todo.completed })} 
                      className="flex-shrink-0"
                    >
                      {todo.completed ? 
                        <CheckCircle className="h-5 w-5 text-emerald-400" /> : 
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      }
                    </button>
                    <span className={`flex-1 text-sm transition-all ${
                      todo.completed ? 'line-through text-muted-foreground opacity-60' : 'text-foreground'
                    }`}>
                      {todo.title}
                    </span>
                    {!todo.completed && (
                      <select
                        value={todo.retainUntil ? '1' : '0'}
                        onChange={(e) => {
                          const days = e.target.value === '0' ? null : parseInt(e.target.value);
                          updateRetentionMutation.mutate({ id: todo.id, days });
                        }}
                        className="text-xs bg-white/5 border border-white/10 rounded-md px-2 py-1 text-muted-foreground hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="0">Today</option>
                        <option value="1">+1 day</option>
                        <option value="2">+2 days</option>
                        <option value="3">+3 days</option>
                      </select>
                    )}
                    {todo.retainUntil && (
                      <div title="Task retained">
                        <Clock className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => deleteTodoMutation.mutate(todo.id)}
                    >
                      <Trash2 className="h-3 w-3 text-pink-400 hover:text-pink-300" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
      
      {/* Bottom Row: Weekly Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="h-[240px] flex-shrink-0"
      >
        <WeeklyActivityGraph weekData={weeklyData} quote={randomQuote} />
      </motion.div>
      </div>

      <FloatingActionButton />

      <GoalSettingsDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goalType={goalDialogType}
        currentValue={goalDialogType === "daily" ? dailyGoal : streakGoal}
        onSave={(value) => {
          if (goalDialogType === "daily") {
            updateGoalMutation.mutate({ dailyGoal: value });
          } else {
            updateGoalMutation.mutate({ streakGoal: value });
          }
        }}
      />
    </div>
  );
}
