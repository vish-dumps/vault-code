import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Target, Flame } from "lucide-react";

interface GoalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalType: "daily" | "streak";
  currentValue: number;
  onSave: (value: number) => void;
}

export function GoalSettingsDialog({ 
  open, 
  onOpenChange, 
  goalType, 
  currentValue, 
  onSave 
}: GoalSettingsDialogProps) {
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    onSave(value);
    onOpenChange(false);
  };

  if (goalType === "daily") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Set Daily Goal
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-sm text-muted-foreground">
              How many problems do you want to solve daily?
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10"
                onClick={() => setValue(Math.min(value + 1, 50))}
              >
                <ChevronUp className="h-6 w-6" />
              </Button>
              <div className="relative">
                <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                  problems/day
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10 mt-4"
                onClick={() => setValue(Math.max(value - 1, 1))}
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Streak goal with preset options
  const streakOptions = [
    { days: 7, label: "7 Days", description: "One Week", tier: 1 },
    { days: 15, label: "15 Days", description: "Two Weeks", tier: 2 },
    { days: 30, label: "30 Days", description: "One Month", tier: 3 },
    { days: 60, label: "60 Days", description: "Two Months", tier: 4 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Set Streak Goal
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="text-sm text-muted-foreground text-center mb-2">
            Choose your streak challenge
          </div>
          <div className="grid grid-cols-2 gap-3">
            {streakOptions.map((option) => (
              <button
                key={option.days}
                onClick={() => setValue(option.days)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  value === option.days
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-border hover:border-orange-500/50 bg-card'
                } ${
                  option.tier === 4 
                    ? 'ring-2 ring-orange-400/50 shadow-lg shadow-orange-500/20' 
                    : option.tier === 3
                    ? 'ring-1 ring-orange-400/30'
                    : ''
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`text-3xl font-bold ${
                    option.tier === 4 
                      ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent'
                      : option.tier === 3
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent'
                      : option.tier === 2
                      ? 'text-orange-400'
                      : 'text-orange-500'
                  }`}>
                    {option.days}
                  </div>
                  <div className="text-xs font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                  {option.tier === 4 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ELITE
                    </div>
                  )}
                  {option.tier === 3 && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      PRO
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Goal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
