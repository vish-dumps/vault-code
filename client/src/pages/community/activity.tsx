import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ActivitySquare } from "lucide-react";

type ActivityItem = {
  id: string;
  type: string;
  summary: string;
  visibility: "public" | "friends";
  details: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName?: string | null;
    handle?: string;
  } | null;
  relatedUsers: {
    id: string;
    username: string;
    displayName?: string | null;
    handle?: string;
  }[];
};

type ActivityResponse = {
  scope: string;
  total: number;
  activities: ActivityItem[];
};

export default function CommunityActivity() {
  const [scope, setScope] = useState<"friends" | "global" | "self">("friends");

  const { data, isLoading } = useQuery<ActivityResponse>({
    queryKey: ["/api/activity", scope],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/activity?scope=${scope}`);
      return res.json();
    },
    refetchInterval: 1000 * 60,
  });

  const activities = data?.activities ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Community Activity</h1>
        <p className="text-muted-foreground">
          Track what&apos;s happening across the CodeVault community in real time.
        </p>
      </div>

      <Tabs value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="self">My Activity</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="h-[70vh]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ActivitySquare className="h-4 w-4" />
            Activity Feed
          </CardTitle>
          <Badge variant={scope === "global" ? "default" : "secondary"}>{scope}</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh]">
            <div className="divide-y">
              {isLoading && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Loading activity...
                </div>
              )}
              {!isLoading && activities.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Nothing to display right now. Check back soon!
                </div>
              )}

              {activities.map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">
                        {activity.user?.displayName ?? activity.user?.username ?? "Unknown user"}
                      </span>
                      <span className="text-sm text-muted-foreground">{activity.summary}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={activity.visibility === "public" ? "outline" : "secondary"}>
                        {activity.visibility}
                      </Badge>
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {activity.relatedUsers.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      With{" "}
                      {activity.relatedUsers
                        .map((user) => user.displayName ?? user.username)
                        .join(", ")}
                    </div>
                  )}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-3 rounded border bg-muted/40 p-3 text-xs text-muted-foreground">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

