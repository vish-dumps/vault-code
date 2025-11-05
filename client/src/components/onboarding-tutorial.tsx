import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Rocket, 
  Chrome, 
  Users, 
  Target, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Code2,
  TrendingUp
} from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to CodeVault! 🎉",
    description: "Your personal coding companion that automatically tracks your progress across LeetCode, Codeforces, and more.",
    icon: <Rocket className="w-12 h-12 text-purple-500" />,
    tips: [
      "Track all your solved problems in one place",
      "Earn XP and maintain streaks to stay motivated",
      "Sync your progress to GitHub automatically",
    ],
  },
  {
    title: "Install the Chrome Extension",
    description: "The extension is your secret weapon — it automatically detects when you solve problems and saves them to your vault.",
    icon: <Chrome className="w-12 h-12 text-blue-500" />,
    tips: [
      "Install the CodeVault Chrome Extension from the Chrome Web Store",
      "Log in to the extension with your CodeVault account",
      "Solve problems normally — CodeVault handles the rest!",
    ],
  },
  {
    title: "Track Your Progress",
    description: "View your dashboard to see your streak, XP, solved problems by difficulty, and contribution heatmap.",
    icon: <TrendingUp className="w-12 h-12 text-green-500" />,
    tips: [
      "Set daily goals to stay consistent",
      "Review your contribution heatmap weekly",
      "Earn XP: Easy (+50), Medium (+80), Hard (+120)",
    ],
  },
  {
    title: "Connect with Friends",
    description: "Add friends, compete for XP, and motivate each other to maintain streaks and solve more problems.",
    icon: <Users className="w-12 h-12 text-pink-500" />,
    tips: [
      "Search for friends and send friend requests",
      "View friends' progress and recent solves",
      "Poke friends to remind them about their streaks",
    ],
  },
  {
    title: "You're All Set! 🚀",
    description: "Start solving problems and watch your vault grow. Remember to check the Usage Playbook for more tips!",
    icon: <Sparkles className="w-12 h-12 text-amber-500" />,
    tips: [
      "Visit the Guide page for detailed tips and tricks",
      "Explore the Workspace for code snippets and todos",
      "Share your progress on LinkedIn and GitHub",
    ],
  },
];

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setOpen(false);
  };

  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Getting Started with CodeVault
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                  {step.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>

              <div className="space-y-2 pl-20">
                {step.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip Tutorial
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Get Started
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
