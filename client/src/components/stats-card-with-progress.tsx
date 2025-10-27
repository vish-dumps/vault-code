import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StatsCardWithProgressProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  progress?: number;
  goal?: number;
  onGoalChange?: (newGoal: number) => void;
  progressType?: "streak" | "daily" | "none";
}

export function StatsCardWithProgress({
  title,
  value,
  icon: Icon,
  trend,
  progress = 0,
  goal = 0,
  onGoalChange,
  progressType = "none",
}: StatsCardWithProgressProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(goal.toString());

  // Sync newGoal when goal prop changes
  useEffect(() => {
    setNewGoal(goal.toString());
  }, [goal]);

  // Determine icon color based on card type
  const getIconHoverColor = () => {
    if (title.toLowerCase().includes('streak')) return 'group-hover:text-orange-500';
    if (title.toLowerCase().includes('problems')) return 'group-hover:text-green-500';
    if (title.toLowerCase().includes('topic')) return 'group-hover:text-blue-500';
    if (title.toLowerCase().includes('snippet')) return 'group-hover:text-purple-500';
    return 'group-hover:text-primary';
  };

  const handleSaveGoal = () => {
    const goalValue = parseInt(newGoal);
    if (!isNaN(goalValue) && goalValue > 0 && onGoalChange) {
      onGoalChange(goalValue);
      setIsDialogOpen(false);
    }
  };

  const progressPercentage = goal > 0 ? Math.min((progress / goal) * 100, 100) : 0;

  // Get gradient color based on progress type
  const getProgressGradient = () => {
    if (progressType === "streak") {
      // Orange to red gradient (fire effect)
      return "from-orange-400 via-orange-500 to-red-500";
    } else if (progressType === "daily") {
      // Green gradient (growth effect)
      return "from-green-400 via-green-500 to-emerald-600";
    }
    return "from-primary via-primary to-primary";
  };

  // Get gradient class based on card type for light theme
  const getLightGradient = () => {
    if (title.toLowerCase().includes('streak')) return 'bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-transparent dark:to-transparent';
    if (title.toLowerCase().includes('problems')) return 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-transparent dark:to-transparent';
    if (title.toLowerCase().includes('topic')) return 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-transparent dark:to-transparent';
    if (title.toLowerCase().includes('snippet')) return 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-transparent dark:to-transparent';
    return '';
  };

  return (
    <>
      <Card
        data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={`group transition-all hover:shadow-lg relative overflow-hidden ${getLightGradient()}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center gap-1">
            {onGoalChange && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsDialogOpen(true)}
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
            <Icon
              className={`h-4 w-4 text-muted-foreground transition-colors duration-300 ${getIconHoverColor()}`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="text-3xl font-bold"
            data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {value}
          </div>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}

          {/* Progress Bar */}
          {progressType !== "none" && goal > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {progress}/{goal}
                </span>
              </div>
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                {progressType === "streak" ? (
                  // Circular/flame effect for streak
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressGradient()} transition-all duration-500 ease-out rounded-full relative`}
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </div>
                ) : (
                  // Segmented bar for daily goals
                  <div className="h-full flex gap-0.5">
                    {Array.from({ length: Math.max(goal, 1) }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all duration-300 ${
                          i < progress
                            ? `bg-gradient-to-t ${getProgressGradient()}`
                            : 'bg-secondary-foreground/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Setting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set {title} Goal</DialogTitle>
            <DialogDescription>
              Set your target goal for {title.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goal" className="text-right">
                Goal
              </Label>
              <Input
                id="goal"
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="col-span-3"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal}>Save Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
