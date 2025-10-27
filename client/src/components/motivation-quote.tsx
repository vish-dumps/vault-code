import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Code2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const quotes = [
  "The code is mightier than the bug.",
  "One more line, one less excuse.",
  "Commit your dreams like you commit your code.",
  "Keep calm and debug on.",
  "Bugs don't scare me — infinite loops do.",
  "Less talk, more git push.",
  "Behind every great coder is a lot of broken code.",
  "Eat. Sleep. Code. Repeat.",
  "If it compiles, ship it. If not, fix it.",
  "The only bad code is the one you didn't write.",
  "Dream in logic, live in syntax.",
  "Stay in the loop, not in an infinite one.",
  "Every error hides a lesson.",
  "Build what you wish existed.",
  "Coding is 10% writing, 90% figuring out why it doesn't work.",
  "Small commits, big progress.",
  "One bug at a time, one victory at a time.",
  "While others sleep, coders compile.",
  "Turn caffeine into clean code.",
  "Logic is art with constraints.",
  "Your future self will thank you for debugging today.",
  "Make your code your canvas.",
  "Real developers don't fear semicolons.",
  "The algorithm always finds a way.",
  "Push through the stack overflow.",
];

export function MotivationQuote() {
  const [quote, setQuote] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  };

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                  💻 Daily Coder Motivation
                </p>
                <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
                  "{quote}"
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
