import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Award, Medal } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  date?: string;
}

interface MilestonesCardProps {
  milestones?: Milestone[];
}

export function MilestonesCard({ milestones = [] }: MilestonesCardProps) {
  // Default milestones if none provided
  const defaultMilestones: Milestone[] = [
    {
      id: '1',
      title: 'First Problem',
      description: 'Solved your first coding problem',
      achieved: true,
      date: '2024-01-15',
    },
    {
      id: '2',
      title: '10 Day Streak',
      description: 'Maintained a 10-day coding streak',
      achieved: false,
    },
    {
      id: '3',
      title: '50 Problems',
      description: 'Solved 50 coding problems',
      achieved: false,
    },
    {
      id: '4',
      title: 'Consistency Master',
      description: 'Achieved 90% consistency score',
      achieved: false,
    },
  ];

  const displayMilestones = milestones.length > 0 ? milestones : defaultMilestones;
  const icons = [Trophy, Star, Award, Medal];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayMilestones.map((milestone, index) => {
            const Icon = icons[index % icons.length];
            return (
              <div
                key={milestone.id}
                className={`p-3 rounded-lg border transition-all ${
                  milestone.achieved
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-muted/30 border-transparent opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      milestone.achieved
                        ? 'bg-yellow-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{milestone.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {milestone.description}
                    </div>
                    {milestone.achieved && milestone.date && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Achieved on {new Date(milestone.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          {displayMilestones.filter(m => m.achieved).length} of {displayMilestones.length} milestones achieved
        </div>
      </CardContent>
    </Card>
  );
}
