import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Contest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  url: string;
}

interface ContestListProps {
  contests: Contest[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function ContestList({ contests, isLoading = false, isError = false, onRetry }: ContestListProps) {
  const { toast } = useToast();

  const createReminderMutation = useMutation({
    mutationFn: async (contest: Contest) => {
      const response = await apiRequest("POST", "/api/todos", {
        title: `Contest: ${contest.name} - ${contest.startTime}`,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/gamification"] });
      toast({
        title: "Reminder Set!",
        description: "Contest reminder added to your TODO list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      });
    },
  });

  return (
    <Card data-testid="card-contest-list" className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0 flex items-center justify-between">
        <CardTitle className="text-base">Upcoming Contests</CardTitle>
        {onRetry && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={onRetry} disabled={isLoading}>
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-md border border-dashed border-border/40 bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground py-6 text-center">
            {isError ? "Unable to load contests. Try refreshing shortly." : "No upcoming contests found right now."}
          </div>
        ) : (
          <div className="space-y-2">
            {contests.map((contest) => (
              <div
                key={contest.id}
                className="flex items-start justify-between p-3 rounded-md border hover-elevate"
                data-testid={`contest-item-${contest.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {contest.platform}
                    </Badge>
                    <h4 className="font-medium text-sm">{contest.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{contest.startTime}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => createReminderMutation.mutate(contest)}
                    data-testid={`button-remind-contest-${contest.id}`}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Remind Me
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(contest.url, "_blank")}
                    data-testid={`button-open-contest-${contest.id}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
