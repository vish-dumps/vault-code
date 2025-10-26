import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CheckCircle, Flame, TrendingUp, Plus, FileCode, Code2, Trash2, CheckSquare, Square } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { StatsCardWithProgress } from "@/components/stats-card-with-progress";
import { ContestList } from "@/components/contest-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  createdAt: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [todoFilter, setTodoFilter] = useState<"all" | "active" | "completed">("all");

  // Fetch questions to calculate stats
  const { data: questions = [] } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/questions"],
  });

  // Fetch contests
  const { data: contests = [] } = useQuery<Contest[]>({
    queryKey: ["/api/contests"],
  });

  // Fetch topic progress
  const { data: topicProgress = [] } = useQuery<TopicProgress[]>({
    queryKey: ["/api/topics"],
  });

  // Fetch snippets count
  const { data: snippets = [] } = useQuery<any[]>({
    queryKey: ["/api/snippets"],
  });

  // Fetch todos
  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Fetch user profile for streak
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async (data: { streakGoal?: number; dailyGoal?: number }) => {
      const response = await apiRequest("PATCH", "/api/user/goals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
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
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({ title: "Success", description: "Todo deleted successfully" });
    },
  });

  // Calculate stats from questions
  const totalProblems = questions.length;
  
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
  const streakGoal = userProfile?.streakGoal || 7;
  const dailyGoal = userProfile?.dailyGoal || 3;
  const dailyProgress = userProfile?.dailyProgress || 0;

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold">Welcome Back, {user?.name || user?.username || "Coder"}</h1>
        <p className="text-muted-foreground mt-2 text-lg">Let's make today count. Keep building your coding skills!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCardWithProgress
          title="Problems Solved"
          value={totalProblems}
          icon={CheckCircle}
          trend={`Daily goal: ${dailyGoal} problems`}
          progress={dailyProgress}
          goal={dailyGoal}
          progressType="daily"
          onGoalChange={(newGoal) => updateGoalMutation.mutate({ dailyGoal: newGoal })}
        />
        <StatsCardWithProgress
          title="Current Streak" 
          value={`${currentStreak} days`}
          icon={Flame}
          progress={currentStreak}
          goal={streakGoal}
          progressType="streak"
          onGoalChange={(newGoal) => updateGoalMutation.mutate({ streakGoal: newGoal })}
        />
        <StatsCard
          title="Top Topic"
          value={topTopic}
          icon={TrendingUp}
          trend={topTopicCount > 0 ? `${topTopicCount} problems` : "Start solving!"}
        />
        <StatsCard
          title="Code Snippets"
          value={snippets.length}
          icon={FileCode}
          trend="Saved snippets"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TODO Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  TO-DO
                </CardTitle>
                <CardDescription>
                  Manage your daily tasks
                </CardDescription>
              </div>
              {todos.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((completedTodosCount / todos.length) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              )}
            </div>
            {/* Wave Progress Bar */}
            {todos.length > 0 && (
              <div className="mt-4 relative h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-teal-500 to-cyan-600 transition-all duration-500 ease-out relative"
                  style={{ width: `${(completedTodosCount / todos.length) * 100}%` }}
                >
                  <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path 
                        d="M0,5 Q25,0 50,5 T100,5 V10 H0 Z" 
                        fill="white"
                        className="animate-pulse"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
              />
              <Button type="submit" disabled={!newTodoTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <Tabs value={todoFilter} onValueChange={(v) => setTodoFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({todos.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({activeTodosCount})</TabsTrigger>
                <TabsTrigger value="completed">Done ({completedTodosCount})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTodos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {todoFilter === "completed" ? "No completed tasks yet" : "No tasks yet. Add one above!"}
                </p>
              ) : (
                filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <button
                      onClick={() => toggleTodoMutation.mutate({ id: todo.id, completed: !todo.completed })}
                      className="flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <span className={`flex-1 transition-opacity ${todo.completed ? 'line-through text-muted-foreground opacity-60' : ''}`}>
                      {todo.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => deleteTodoMutation.mutate(todo.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contests and Quick Actions */}
        <div className="space-y-6">
          <ContestList contests={contests} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Jump to your most used features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/workspace")}
              >
                <Code2 className="h-4 w-4 mr-2" />
                Create New Snippet
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/snippets")}
              >
                <FileCode className="h-4 w-4 mr-2" />
                View All Snippets
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/questions/add")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Question
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
