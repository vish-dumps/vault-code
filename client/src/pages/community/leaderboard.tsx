import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Trophy, Crown, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type LeaderboardEntry = {
  userId: string;
  username: string;
  handle: string;
  displayName?: string | null;
  xp: number;
  solvedCount: number;
  badge?: string;
  rank: number;
  isSelf: boolean;
  isFriend: boolean;
};

type LeaderboardResponse = {
  type: string;
  weekKey: string;
  label: string;
  generatedAt: string;
  entries: LeaderboardEntry[];
};

type LeaderboardHistoryResponse = {
  history: {
    weekKey: string;
    label: string;
    generatedAt: string;
    topEntries: {
      rank: number;
      userId: string;
      username: string;
      handle: string;
      displayName?: string | null;
      solvedCount: number;
      xp: number;
      badge?: string | null;
    }[];
  }[];
};

export default function CommunityLeaderboard() {
  const [type, setType] = useState<"global" | "friends">("global");

  const leaderboardQuery = useQuery<LeaderboardResponse>({
    queryKey: ["/api/leaderboard", type],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/leaderboard?type=${type}`);
      return res.json();
    },
    refetchInterval: 1000 * 60 * 5,
  });

  const historyQuery = useQuery<LeaderboardHistoryResponse>({
    queryKey: ["/api/leaderboard/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/leaderboard/history");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  const entries = leaderboardQuery.data?.entries ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Community Leaderboard</h1>
        <p className="text-muted-foreground">
          Weekly rankings refresh every Monday at midnight. Stay consistent to earn badges!
        </p>
      </div>

      <Tabs value={type} onValueChange={(value) => setType(value as typeof type)}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>{leaderboardQuery.data?.label ?? "Current Week"}</CardTitle>
          </div>
          {leaderboardQuery.data && (
            <div className="text-sm text-muted-foreground">
              Updated {formatDistanceToNow(new Date(leaderboardQuery.data.generatedAt), { addSuffix: true })}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Solved</TableHead>
                <TableHead>XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading leaderboard...
                  </TableCell>
                </TableRow>
              )}
              {!leaderboardQuery.isLoading && entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No rankings available yet.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((entry) => (
                <TableRow key={entry.userId} className={entry.isSelf ? "bg-muted/40" : undefined}>
                  <TableCell className="font-semibold">
                    {entry.rank <= 3 ? (
                      <Badge variant="default" className="gap-1 text-xs">
                        <Crown className="h-4 w-4" />
                        {entry.rank}
                      </Badge>
                    ) : (
                      entry.rank
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {entry.displayName ?? entry.username}
                      </span>
                      <span className="text-xs text-muted-foreground">{entry.handle}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.badge ? (
                      <Badge variant="outline">{entry.badge}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{entry.solvedCount}</TableCell>
                  <TableCell>{entry.xp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Recent Top Coders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {historyQuery.isLoading && (
            <div className="text-sm text-muted-foreground">Loading history...</div>
          )}
          {!historyQuery.isLoading && (historyQuery.data?.history.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">No history available yet.</div>
          )}
          {historyQuery.data?.history.map((item) => (
            <div key={item.weekKey} className="rounded-lg border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs text-muted-foreground">
                  Generated {formatDistanceToNow(new Date(item.generatedAt), { addSuffix: true })}
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {item.topEntries.map((entry) => (
                  <div key={entry.userId} className="rounded border bg-muted/40 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        #{entry.rank} {entry.displayName ?? entry.username}
                      </span>
                      {entry.badge && <Badge variant="outline">{entry.badge}</Badge>}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Solved {entry.solvedCount} · {entry.xp} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

