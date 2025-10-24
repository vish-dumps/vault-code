import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Contest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  url: string;
}

interface ContestListProps {
  contests: Contest[];
}

export function ContestList({ contests }: ContestListProps) {
  return (
    <Card data-testid="card-contest-list">
      <CardHeader>
        <CardTitle>Upcoming Contests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(contest.url, '_blank')}
                data-testid={`button-open-contest-${contest.id}`}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
