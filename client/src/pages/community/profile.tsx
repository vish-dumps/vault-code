import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, UserMinus, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type ProfileResponse = {
  profile: {
    id: string;
    username: string;
    handle?: string;
    displayName?: string | null;
    name?: string | null;
    bio?: string | null;
    college?: string | null;
    xp: number;
    badge?: string;
    badgesEarned?: string[];
    links: {
      leetcode?: string | null;
      codeforces?: string | null;
    };
    streak: number;
    maxStreak: number;
    dailyGoal: number;
    dailyProgress: number;
    createdAt: string;
  };
  stats: {
    totalSolved: number;
    platformBreakdown: { platform: string; solved: number }[];
    weeklyProgress: { label: string; solved: number }[];
    conceptProgress: { tag: string; solved: number }[];
  } | null;
  privacy: {
    visibility: "public" | "friends";
    hideFromLeaderboard: boolean;
  };
  social: {
    isSelf: boolean;
    isFriend: boolean;
    mutualCount: number;
    friendCount: number;
    mutualFriends: any[];
    friendsPreview: any[];
  };
};

export default function CommunityProfile() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ identity: string }>("/u/:identity");
  const { toast } = useToast();

  useEffect(() => {
    if (!match) {
      navigate("/community/search");
    }
  }, [match, navigate]);

  const identity = params?.identity ?? "me";

  const { data, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["/api/users", identity],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${identity}`);
      return res.json();
    },
    enabled: Boolean(identity),
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (target: string) => {
      const res = await apiRequest("POST", "/api/friends/requests", { target });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? "Unable to send friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", identity] });
      toast({ title: "Request sent", description: "Friend request sent successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send request", description: error.message, variant: "destructive" });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", identity] });
      toast({ title: "Friend removed", description: "You are no longer connected." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove friend.", variant: "destructive" });
    },
  });

  const profile = data?.profile;

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" className="mb-2" onClick={() => navigate("/community/search")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to search
      </Button>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Loading profile...
        </div>
      )}

      {!isLoading && !profile && (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Profile not found or is private.
        </div>
      )}

      {profile && (
        <>
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-semibold">{profile.displayName ?? profile.username}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Badge variant="outline">{profile.handle}</Badge>
                    <Badge variant="secondary">{profile.badge ?? "Coder"}</Badge>
                    <span>{profile.xp} XP</span>
                    <span>Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                {!data?.social.isSelf && (
                  <div className="flex gap-2">
                    {data?.social.isFriend ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFriendMutation.mutate(profile.id)}
                        disabled={removeFriendMutation.isPending}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove Friend
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => sendRequestMutation.mutate(profile.handle ?? profile.username)}
                        disabled={sendRequestMutation.isPending}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Friend
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.bio && <p className="text-sm text-foreground">{profile.bio}</p>}
              {profile.college && (
                <div className="text-xs text-muted-foreground">College: {profile.college}</div>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <Badge variant="outline">Current streak {profile.streak}</Badge>
                <Badge variant="outline">Max streak {profile.maxStreak}</Badge>
                <Badge variant="outline">Daily goal {profile.dailyGoal}</Badge>
                <Badge variant="outline">Progress today {profile.dailyProgress}</Badge>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {profile.links.leetcode && (
                  <Button variant="ghost" className="px-0" asChild>
                    <a href={`https://leetcode.com/${profile.links.leetcode}`} target="_blank" rel="noreferrer">
                      LeetCode
                    </a>
                  </Button>
                )}
                {profile.links.codeforces && (
                  <Button variant="ghost" className="px-0" asChild>
                    <a href={`https://codeforces.com/profile/${profile.links.codeforces}`} target="_blank" rel="noreferrer">
                      Codeforces
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold">Platform stats</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.stats?.platformBreakdown?.length ? (
                  <div className="space-y-2">
                    {data.stats.platformBreakdown.map((item) => (
                      <div key={item.platform} className="flex items-center justify-between text-sm">
                        <span>{item.platform}</span>
                        <Badge variant="secondary">{item.solved} solved</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No public statistics available.</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold">Weekly progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data?.stats?.weeklyProgress?.length ? (
                  data.stats.weeklyProgress.map((week) => (
                    <div key={week.label} className="flex items-center justify-between text-sm">
                      <span>{week.label}</span>
                      <Badge variant="outline">{week.solved} solved</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Weekly stats are hidden or unavailable.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {data?.social.friendCount ?? 0} friends | {data?.social.mutualCount ?? 0} mutual connections
              </div>
              <Separator />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data?.social.friendsPreview?.length ? (
                  data.social.friendsPreview.map((friend: any) => (
                    <div key={friend.id} className="rounded border bg-muted/40 p-3 text-sm">
                      <div className="font-semibold text-foreground">{friend.displayName ?? friend.username}</div>
                      <div className="text-xs text-muted-foreground">{friend.handle}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No public friend list available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}



