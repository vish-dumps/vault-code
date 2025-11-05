import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserPlus, UserMinus, UserCheck, UserX, Sparkles, Clock, Bell, Code2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FriendSummary = {
  id: string;
  username: string;
  displayName?: string | null;
  handle?: string;
  avatar?: {
    type?: string;
    customUrl?: string | null;
    gender?: string | null;
    seed?: number | null;
  };
  xp?: number;
  badge?: string;
  bio?: string | null;
  streak?: number;
  maxStreak?: number;
  dailyGoal?: number;
  dailyProgress?: number;
  lastSolveAt?: string | null;
  isMutual?: boolean;
  isViewer?: boolean;
};

type FriendListResponse = {
  total: number;
  mutualCount: number;
  friends: FriendSummary[];
};

type FriendRequest = {
  id: string;
  status: string;
  createdAt: string;
  requesterId: string;
  recipientId: string;
  requester?: FriendSummary;
  recipient?: FriendSummary;
};

type FriendRequestsResponse = {
  incoming: (FriendRequest & { requester: FriendSummary })[];
  outgoing: (FriendRequest & { recipient: FriendSummary })[];
};

type SearchResult = {
  id: string;
  username: string;
  displayName?: string | null;
  handle?: string;
  badge?: string;
  xp?: number;
  bio?: string | null;
  isFriend?: boolean;
  isSelf?: boolean;
};

type FriendProfileResponse = {
  profile: {
    id: string;
    username: string;
    displayName?: string | null;
    handle?: string;
    xp: number;
    badge?: string;
    streak: number;
    dailyGoal: number;
    dailyProgress: number;
    createdAt: string;
    bio?: string | null;
    avatar?: {
      type?: string;
      gender?: string;
      customUrl?: string | null;
      seed?: number | null;
    };
  };
  stats: {
    totalSolved: number;
    platformBreakdown: { platform: string; solved: number }[];
    weeklyProgress: { label: string; solved: number }[];
  } | null;
  recentSolved: {
    title: string;
    platform: string;
    difficulty: string | null;
    solvedAt: string | null;
  }[];
};

type ActivityResponse = {
  activities: Array<{
    id: string;
    summary: string;
    createdAt: string;
    user?: {
      id: string;
      displayName?: string | null;
      username?: string;
      handle?: string;
    };
    details?: Record<string, unknown>;
  }>;
};

function getAvatarUrl(
  friend:
    | FriendSummary
    | SearchResult
    | FriendProfileResponse["profile"]
    | { avatar?: { customUrl?: string | null; type?: string; gender?: string; seed?: number | null } | null | undefined }
) {
  const avatar = (friend as { avatar?: FriendSummary["avatar"] }).avatar;
  if (!avatar) return null;
  if (avatar.customUrl) return avatar.customUrl;
  if (avatar.type === "random") {
    const genderPath = avatar.gender === "female" ? "girl" : "boy";
    const seed = avatar.seed ?? (friend as any).id ?? (friend as any).username ?? "codevault";
    return `https://avatar.iran.liara.run/public/${genderPath}?username=${seed}`;
  }
  return null;
}

export default function CommunityFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"friends" | "requests" | "discover" | "insights">("friends");
  const [search, setSearch] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; name: string } | null>(null);

  const identity = user?.id ?? "me";

  const friendsQuery = useQuery<FriendListResponse>({
    queryKey: ["/api/users/me/friends"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${identity}/friends?limit=50`);
      return res.json();
    },
  });

  const requestsQuery = useQuery<FriendRequestsResponse>({
    queryKey: ["/api/friends/requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/friends/requests");
      return res.json();
    },
  });

  const searchQuery = useQuery<SearchResult[]>({
    queryKey: ["/api/users/search", search],
    enabled: search.trim().length > 1,
    queryFn: async () => {
      const params = new URLSearchParams({ q: search.trim() });
      const res = await apiRequest("GET", `/api/users/search?${params.toString()}`);
      return res.json();
    },
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
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/friends"] });
      const status = response?.status ?? "pending";
      if (status === "accepted") {
        toast({ title: "Friend connected", description: "You are now connected." });
        setTab("friends");
      } else {
        toast({ title: "Request sent", description: "We will let them know you want to connect." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
    },
  });

  const respondRequestMutation = useMutation({
    mutationFn: async (args: { id: string; action: "accept" | "decline" | "cancel" }) => {
      const res = await apiRequest("PATCH", `/api/friends/requests/${args.id}`, {
        action: args.action,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? "Unable to update request");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/friends"] });
      if (variables.action === "accept") {
        toast({ title: "Friend connected", description: "You are now connected." });
      } else if (variables.action === "decline") {
        toast({ title: "Request declined" });
      } else {
        toast({ title: "Request cancelled" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({ title: "Friend removed", description: "Connection removed successfully." });
      setIsDetailsOpen(false);
      setFriendToRemove(null);
      setSelectedFriendId(null);
    },
  });

  const pokeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("POST", `/api/friends/${friendId}/poke`, {});
    },
    onSuccess: () => {
      toast({ 
        title: "Poke sent! 👋", 
        description: "Your friend will be notified to maintain their streak." 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to send poke.", 
        variant: "destructive" 
      });
    },
  });

  const friends = friendsQuery.data?.friends ?? [];
  const incoming = requestsQuery.data?.incoming ?? [];
  const outgoing = requestsQuery.data?.outgoing ?? [];
  const searchResults = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  const outgoingRequestsByUser = useMemo(() => {
    const map = new Map<string, FriendRequest>();
    outgoing.forEach((request) => {
      const recipientId = request.recipient?.id;
      if (recipientId) {
        map.set(recipientId, request);
      }
    });
    return map;
  }, [outgoing]);

  const incomingRequestsByUser = useMemo(() => {
    const map = new Map<string, FriendRequest>();
    incoming.forEach((request) => {
      const requesterId = request.requester?.id;
      if (requesterId) {
        map.set(requesterId, request);
      }
    });
    return map;
  }, [incoming]);

  useEffect(() => {
    if (!friends.length) {
      setSelectedFriendId(null);
      return;
    }
    if (!selectedFriendId || !friends.some((friend) => friend.id === selectedFriendId)) {
      setSelectedFriendId(friends[0].id);
    }
  }, [friends, selectedFriendId]);

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId) ?? null,
    [friends, selectedFriendId]
  );

  const { data: friendProfile, isLoading: isFriendProfileLoading } = useQuery<FriendProfileResponse>({
    queryKey: ["/api/users", selectedFriendId],
    enabled: Boolean(selectedFriendId),
    queryFn: async () => {
      const targetId = selectedFriendId as string;
      const res = await apiRequest("GET", `/api/users/${targetId}`);
      return res.json();
    },
  });

  const { data: activityData } = useQuery<ActivityResponse>({
    queryKey: ["/api/activity", "friends"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/activity?scope=friends");
      return res.json();
    },
  });

  const friendActivities = activityData?.activities ?? [];

  const weeklyQuestionInsights = useMemo(() => {
    if (!friendActivities.length) {
      return { total: 0, leaderboard: [] as Array<{ name: string; count: number }>, max: 0 };
    }
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const solvedByUser = new Map<string, { name: string; count: number }>();
    friendActivities.forEach((activity) => {
      const createdAt = new Date(activity.createdAt);
      if (Number.isNaN(createdAt.getTime()) || createdAt < weekAgo) return;
      if (!activity.summary.toLowerCase().includes("solv")) return;
      const actorId = activity.user?.id;
      if (!actorId) return;
      const label = activity.user?.displayName ?? activity.user?.username ?? "Friend";
      const details = activity.details as { count?: unknown } | undefined;
      const rawCount =
        details && typeof details.count === "number" && details.count > 0 ? details.count : 1;
      const entry = solvedByUser.get(actorId) ?? { name: label, count: 0 };
      entry.count += rawCount;
      solvedByUser.set(actorId, entry);
    });
    const leaderboard = Array.from(solvedByUser.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const max = leaderboard.reduce((acc, item) => Math.max(acc, item.count), 0);
    const total = Array.from(solvedByUser.values()).reduce((acc, item) => acc + item.count, 0);
    return { total, leaderboard, max };
  }, [friendActivities]);

  const streakLeaders = useMemo(() => {
    return [...friends]
      .filter((friend) => (friend.streak ?? 0) > 0)
      .sort((a, b) => (b.streak ?? 0) - (a.streak ?? 0))
      .slice(0, 5);
  }, [friends]);

  const xpLeaders = useMemo(() => {
    const sorted = [...friends].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, 5);
    const max = sorted.reduce((acc, friend) => Math.max(acc, friend.xp ?? 0), 0);
    return { leaderboard: sorted, max };
  }, [friends]);

  const thisWeekSolvedCount =
    friendProfile?.stats?.weeklyProgress && friendProfile.stats.weeklyProgress.length > 0
      ? friendProfile.stats.weeklyProgress[friendProfile.stats.weeklyProgress.length - 1].solved
      : 0;
  const topPlatformBreakdown = friendProfile?.stats?.platformBreakdown?.slice(0, 3) ?? [];
  const dailyGoalTarget = friendProfile?.profile.dailyGoal ?? 0;
  const dailyGoalProgress = friendProfile?.profile.dailyProgress ?? 0;
  const dailyGoalPercent =
    dailyGoalTarget > 0 ? Math.min(100, Math.round((dailyGoalProgress / dailyGoalTarget) * 100)) : 0;
  const friendRecentSolved = friendProfile?.recentSolved ?? [];

  return (
    <>
      <Sheet open={isDetailsOpen && Boolean(selectedFriendId)} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>Friend spotlight</SheetTitle>
            <SheetDescription>
              Dive into recent progress, XP milestones, and streaks for your selected friend.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100vh-9rem)] pr-2">
            {isFriendProfileLoading || !friendProfile || !selectedFriend ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Loading friend details...</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    {(() => {
                      const avatarUrl = getAvatarUrl(friendProfile.profile);
                      return avatarUrl ? (
                        <AvatarImage
                          src={avatarUrl}
                          alt={friendProfile.profile.displayName ?? friendProfile.profile.username}
                        />
                      ) : null;
                    })()}
                    <AvatarFallback>
                      {(friendProfile.profile.displayName ?? friendProfile.profile.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">
                        {friendProfile.profile.displayName ?? friendProfile.profile.username}
                      </h3>
                      {friendProfile.profile.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {friendProfile.profile.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {friendProfile.profile.handle ? friendProfile.profile.handle + " - " : ""}
                      Joined{" "}
                      {formatDistanceToNow(new Date(friendProfile.profile.createdAt), { addSuffix: true })}
                    </div>
                    {friendProfile.profile.bio && (
                      <p className="mt-2 text-sm text-muted-foreground">{friendProfile.profile.bio}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">XP</p>
                    <p className="font-semibold">{friendProfile.profile.xp} pts</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">Total solved</p>
                    <p className="font-semibold">{friendProfile.stats?.totalSolved ?? 0}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">Current streak</p>
                    <p className="font-semibold">{friendProfile.profile.streak} days</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">This week</p>
                    <p className="font-semibold">{thisWeekSolvedCount} solved</p>
                  </div>
                </div>

                <div className="rounded border p-3">
                  <p className="text-xs text-muted-foreground">Today's goal</p>
                  <p className="text-sm text-muted-foreground">
                    {dailyGoalProgress}/{dailyGoalTarget || '-'} problems
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${dailyGoalPercent}%` }}
                    />
                  </div>
                </div>

                {topPlatformBreakdown.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Favorite platforms</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {topPlatformBreakdown.map((item) => (
                        <div key={item.platform} className="flex items-center justify-between rounded border px-3 py-2">
                          <span>{item.platform}</span>
                          <span className="font-medium text-foreground">{item.solved}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {friendRecentSolved.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Recently solved</h4>
                    <div className="space-y-2 text-xs">
                      {friendRecentSolved.map((question, index) => (
                        <div key={`${question.title}-${index}`} className="rounded border px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground truncate">{question.title}</span>
                            {question.solvedAt && (
                              <span className="text-muted-foreground">
                                {formatDistanceToNow(new Date(question.solvedAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                            <span>{question.platform}</span>
                            {question.difficulty && (
                              <Badge variant="outline" className="text-[10px]">
                                {question.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedFriend?.isViewer && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setFriendToRemove({
                      id: friendProfile.profile.id,
                      name: friendProfile.profile.displayName || friendProfile.profile.username || "this friend"
                    })}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove friend
                  </Button>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">XP</p>
                    <p className="font-semibold">{friendProfile.profile.xp} pts</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">Total solved</p>
                    <p className="font-semibold">{friendProfile.stats?.totalSolved ?? 0}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">Current streak</p>
                    <p className="font-semibold">{friendProfile.profile.streak} days</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">Daily goal</p>
                    <p className="font-semibold">
                      {friendProfile.profile.dailyProgress}/{friendProfile.profile.dailyGoal}
                    </p>
                  </div>
                </div>

                {friendProfile.stats?.weeklyProgress?.length ? (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Weekly progress</h4>
                    <div className="space-y-2 text-xs">
                      {friendProfile.stats.weeklyProgress.slice(0, 5).map((week) => (
                        <div key={week.label} className="flex items-center justify-between rounded border px-3 py-2">
                          <span>{week.label}</span>
                          <span className="font-semibold">{week.solved} solved</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {friendProfile.stats?.platformBreakdown?.length ? (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Platform mix</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {friendProfile.stats.platformBreakdown.slice(0, 5).map((item) => (
                        <div key={item.platform} className="flex items-center justify-between rounded border px-3 py-2">
                          <span>{item.platform}</span>
                          <span className="font-medium text-foreground">{item.solved}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Friends & Connections</h1>
        <p className="text-muted-foreground">
          Connect with other coders, collaborate on problems, and track each other&apos;s progress.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "friends" && (
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Your friends</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Total {friendsQuery.data?.total ?? 0} | Mutual friends {friendsQuery.data?.mutualCount ?? 0}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {friendsQuery.isLoading && (
                <div className="md:col-span-2 text-center text-sm text-muted-foreground">
                  Loading friends...
                </div>
              )}
              {!friendsQuery.isLoading && friends.length === 0 && (
                <div className="md:col-span-2 text-center text-sm text-muted-foreground">
                  You don&apos;t have any friends yet. Switch to Discover to start connecting!
                </div>
              )}
              {friends.map((friend) => {
                const avatarUrl = getAvatarUrl(friend);
                return (
                  <div key={friend.id} className="flex items-start justify-between rounded border p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={friend.displayName ?? friend.username} />}
                        <AvatarFallback>
                          {(friend.displayName ?? friend.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {friend.displayName ?? friend.username}
                          </span>
                          {friend.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {friend.badge}
                            </Badge>
                          )}
                          {friend.isMutual && <Badge variant="outline">Mutual</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{friend.handle}</div>
                        <div className="text-xs font-semibold text-amber-600">
                          {friend.xp ?? 0} XP
                        </div>
                        {friend.bio && <p className="text-xs text-muted-foreground line-clamp-2">{friend.bio}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/community/friends/${friend.id}`)}
                      >
                        <Sparkles className="mr-1 h-4 w-4" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
      </CardContent>
    </Card>
  )}
      {tab === "requests" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Incoming requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requestsQuery.isLoading && (
                <div className="text-sm text-muted-foreground">Loading...</div>
              )}
              {!requestsQuery.isLoading && incoming.length === 0 && (
                <div className="text-sm text-muted-foreground">No incoming requests.</div>
              )}
              {incoming.map((request) => (
                <div key={request.id} className="flex items-start justify-between rounded border p-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {request.requester.displayName ?? request.requester.username}
                    </span>
                    <span className="text-xs text-muted-foreground">{request.requester.handle}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        respondRequestMutation.mutate({ id: request.id, action: "accept" })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        respondRequestMutation.mutate({ id: request.id, action: "decline" })
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-secondary" />
              <CardTitle className="text-base font-semibold">Outgoing requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requestsQuery.isLoading && (
                <div className="text-sm text-muted-foreground">Loading...</div>
              )}
              {!requestsQuery.isLoading && outgoing.length === 0 && (
                <div className="text-sm text-muted-foreground">No pending requests.</div>
              )}
              {outgoing.map((request) => (
                <div key={request.id} className="flex items-start justify-between rounded border p-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {request.recipient.displayName ?? request.recipient.username}
                    </span>
                    <span className="text-xs text-muted-foreground">{request.recipient.handle}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      respondRequestMutation.mutate({ id: request.id, action: "cancel" })
                    }
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "discover" && (
        <Card>
          <CardHeader className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Discover coders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by username or handle..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search.length <= 1 && (
              <div className="text-sm text-muted-foreground">
                Type at least two characters to search.
              </div>
            )}
            {search.length > 1 && searchQuery.isLoading && (
              <div className="text-sm text-muted-foreground">Searching...</div>
            )}
            {search.length > 1 && !searchQuery.isLoading && searchResults.length === 0 && (
              <div className="text-sm text-muted-foreground">No users found.</div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {searchResults.map((result) => {
                const outgoingRequest = outgoingRequestsByUser.get(result.id);
                const incomingRequest = incomingRequestsByUser.get(result.id);
                const isConnected = result.isFriend;
                return (
                  <div key={result.id} className="flex items-start justify-between rounded border p-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground">
                        {result.displayName ?? result.username}
                      </span>
                      <span className="text-xs text-muted-foreground">{result.handle}</span>
                      {result.bio && <p className="text-xs text-muted-foreground">{result.bio}</p>}
                    </div>
                    {!result.isSelf && (
                      <div className="flex flex-col items-end gap-2">
                        {isConnected && (
                          <Badge variant="secondary" className="text-xs">
                            Connected
                          </Badge>
                        )}
                        {!isConnected && incomingRequest && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                respondRequestMutation.mutate({ id: incomingRequest.id, action: "accept" })
                              }
                              disabled={respondRequestMutation.isPending}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                respondRequestMutation.mutate({ id: incomingRequest.id, action: "decline" })
                              }
                              disabled={respondRequestMutation.isPending}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                        {!isConnected && !incomingRequest && outgoingRequest && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled>
                              Request sent
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                respondRequestMutation.mutate({ id: outgoingRequest.id, action: "cancel" })
                              }
                              disabled={respondRequestMutation.isPending}
                            >
                              Retrieve
                            </Button>
                          </div>
                        )}
                        {!isConnected && !incomingRequest && !outgoingRequest && (
                          <Button
                            size="sm"
                            onClick={() => sendRequestMutation.mutate(result.handle ?? result.username)}
                            disabled={sendRequestMutation.isPending}
                          >
                            Add friend
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "insights" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">This week's sprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyQuestionInsights.leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Once your friends solve problems this week, their progress will appear here.
                </p>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    {weeklyQuestionInsights.total} problems solved across your circle in the last 7 days.
                  </div>
                  <div className="space-y-3">
                    {weeklyQuestionInsights.leaderboard.map((entry) => (
                      <div key={entry.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{entry.name}</span>
                          <span className="text-muted-foreground">{entry.count} solved</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${weeklyQuestionInsights.max > 0 ? (entry.count / weeklyQuestionInsights.max) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Streak scoreboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {streakLeaders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active streaks yet. Encourage your friends to log a solve!</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {streakLeaders.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between rounded border px-3 py-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium text-foreground">{friend.displayName ?? friend.username}</span>
                        <span className="text-muted-foreground">{friend.streak ?? 0} days</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => pokeFriendMutation.mutate(friend.id)}
                        disabled={pokeFriendMutation.isPending}
                        title="Remind them to maintain their streak"
                      >
                        <Bell className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Team XP momentum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {xpLeaders.leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">Invite friends to CodeVault to start tracking XP momentum together.</p>
              ) : (
                <div className="space-y-3">
                  {xpLeaders.leaderboard.slice(0, 5).map((friend) => (
                    <div key={friend.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{friend.displayName ?? friend.username}</span>
                        <span className="text-muted-foreground">{friend.xp ?? 0} XP</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${xpLeaders.max > 0 ? ((friend.xp ?? 0) / xpLeaders.max) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {friendActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity from friends.</p>
              ) : (
                <div className="space-y-3">
                  {friendActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">
                          <span className="font-semibold">{activity.user?.displayName ?? activity.user?.username}</span>
                          {" "}
                          <span className="text-muted-foreground">{activity.summary}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>

    {/* Remove Friend Confirmation Dialog */}
    <AlertDialog open={!!friendToRemove} onOpenChange={(open) => !open && setFriendToRemove(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <span className="font-semibold">{friendToRemove?.name}</span> from your friends list?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => friendToRemove && removeFriendMutation.mutate(friendToRemove.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove Friend
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}


