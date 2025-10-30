import { ContestList } from "@/components/contest-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

//todo: remove mock functionality
const recentContests = [
  {
    id: "p1",
    name: "Weekly Contest 418",
    platform: "LeetCode",
    date: "Oct 20, 2025",
    rank: "1,234",
    solved: "3/4",
  },
  {
    id: "p2",
    name: "Codeforces Round #911 (Div. 2)",
    platform: "Codeforces",
    date: "Oct 18, 2025",
    rank: "2,456",
    solved: "4/6",
  },
];

export default function Contests() {
  const {
    data: upcomingContests = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/contests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contests");
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contests</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with upcoming coding competitions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContestList
            contests={upcomingContests}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
          />
        </div>

        <div className="space-y-4">
          <Card data-testid="card-recent-participation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Recent Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentContests.map((contest) => (
                  <div
                    key={contest.id}
                    className="p-3 rounded-md border"
                    data-testid={`past-contest-${contest.id}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {contest.platform}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-2">{contest.name}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{contest.date}</span>
                      </div>
                      <div className="flex gap-3">
                        <span>Rank: {contest.rank}</span>
                        <span>Solved: {contest.solved}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
