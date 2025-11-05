import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Trophy, Target, Zap, Calendar, Code2, TrendingUp, ExternalLink, UserMinus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FriendProfileResponse = {
  profile: {
    id: string;
    username: string;
    displayName?: string | null;
    handle?: string;
    links?: {
      leetcode?: string | null;
      codeforces?: string | null;
    };
    xp: number;
    badge?: string;
    streak: number;
    maxStreak: number;
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
    link?: string | null;
  }[];
};

function getAvatarUrl(profile: FriendProfileResponse["profile"]) {
  const avatar = profile.avatar;
  if (!avatar) return null;
  if (avatar.customUrl) return avatar.customUrl;
  if (avatar.type === "random") {
    const genderPath = avatar.gender === "female" ? "girl" : "boy";
    const seed = avatar.seed ?? profile.id ?? profile.username ?? "codevault";
    return `https://avatar.iran.liara.run/public/${genderPath}?username=${seed}`;
  }
  return null;
}

function getDifficultyColor(difficulty: string | null) {
  if (!difficulty) return "bg-gray-500";
  const lower = difficulty.toLowerCase();
  if (lower === "easy") return "bg-green-500";
  if (lower === "medium") return "bg-yellow-500";
  if (lower === "hard") return "bg-red-500";
  return "bg-gray-500";
}

function sanitizeHandle(value: string | null | undefined) {
  if (!value) return null;
  return value.replace(/^@+/, "").trim();
}

function formatExternalHandle(value: string | null | undefined) {
  const sanitized = sanitizeHandle(value);
  return sanitized ? `@${sanitized}` : null;
}

function buildHandleUrl(type: "leetcode" | "codeforces", handle: string) {
  const sanitized = sanitizeHandle(handle) ?? "";
  if (type === "leetcode") {
    return `https://leetcode.com/${sanitized}/`;
  }
  return `https://codeforces.com/profile/${sanitized}`;
}

export default function FriendProfile() {
  const { friendId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const { data: friendProfile, isLoading } = useQuery<FriendProfileResponse>({
    queryKey: ["/api/users", friendId],
    enabled: Boolean(friendId),
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${friendId}`);
      return res.json();
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/friends"] });
      toast({ title: "Friend removed", description: "Connection removed successfully." });
      setLocation("/community/friends");
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to remove friend.", 
        variant: "destructive" 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/community/friends")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Friends
          </Button>
        </div>
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!friendProfile) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/community/friends")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Friends
          </Button>
        </div>
        <div className="text-center text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  const { profile, stats, recentSolved } = friendProfile;
  const avatarUrl = getAvatarUrl(profile);
  const thisWeekSolved = stats?.weeklyProgress && stats.weeklyProgress.length > 0
    ? stats.weeklyProgress[stats.weeklyProgress.length - 1].solved
    : 0;
  const dailyGoalPercent = profile.dailyGoal > 0 
    ? Math.min(100, Math.round((profile.dailyProgress / profile.dailyGoal) * 100)) 
    : 0;

  return (
    <>
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {profile.displayName || profile.username} from your friends list? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeFriendMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Friend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/community/friends")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Friends
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowRemoveDialog(true)}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove Friend
            </Button>
          </div>

          {/* Profile Header Card */}
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.displayName ?? profile.username} />}
                  <AvatarFallback className="text-4xl">
                    {(profile.displayName ?? profile.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-4xl font-bold">{profile.displayName ?? profile.username}</h1>
                    {profile.handle && (
                      <p className="text-lg text-muted-foreground">{profile.handle}</p>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3">
                    {profile.badge && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        <Trophy className="h-4 w-4 mr-1" />
                        {profile.badge}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                    </Badge>
                  </div>
          </div>
        </div>
      </CardContent>
    </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total XP</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{profile.xp}</p>
                  </div>
                  <Zap className="h-10 w-10 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{profile.streak} days</p>
                  </div>
                  <Target className="h-10 w-10 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Max Streak</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{profile.maxStreak} days</p>
                  </div>
                  <Trophy className="h-10 w-10 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Solved</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.totalSolved ?? 0}</p>
                  </div>
                  <Code2 className="h-10 w-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Progress & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Goal Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Today's Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {profile.dailyProgress} / {profile.dailyGoal || '-'} problems
                    </span>
                    <span className="text-sm font-semibold">{dailyGoalPercent}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                      style={{ width: `${dailyGoalPercent}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Progress */}
              {stats?.weeklyProgress && stats.weeklyProgress.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground mb-4">
                        Solved {thisWeekSolved} problems this week
                      </div>
                      {stats.weeklyProgress.slice(-5).map((week) => (
                        <div key={week.label} className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="font-medium">{week.label}</span>
                          <Badge variant="secondary">{week.solved} solved</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recently Solved */}
              {recentSolved.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      Recently Solved
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSolved.map((question, index) => (
                        <div key={`${question.title}-${index}`} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold truncate">{question.title}</h4>
                                {question.difficulty && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getDifficultyColor(question.difficulty)}`}>
                                    {question.difficulty}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{question.platform}</span>
                                {question.solvedAt && (
                                  <>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(question.solvedAt), { addSuffix: true })}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {question.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(question.link!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Platform Breakdown */}
            <div className="space-y-6">
              {stats?.platformBreakdown && stats.platformBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      Platform Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.platformBreakdown.slice(0, 5).map((item) => {
                        const percentage = stats.totalSolved > 0 
                          ? Math.round((item.solved / stats.totalSolved) * 100) 
                          : 0;
                        return (
                          <div key={item.platform} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{item.platform}</span>
                              <span className="text-muted-foreground">{item.solved} ({percentage}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              {Boolean(profile.links?.leetcode || profile.links?.codeforces) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      Competitive Handles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.links?.leetcode && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-semibold">LeetCode</p>
                          <p className="text-sm text-muted-foreground">
                            {formatExternalHandle(profile.links.leetcode)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={buildHandleUrl("leetcode", profile.links.leetcode)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="mr-1 h-4 w-4" />
                            View
                          </a>
                        </Button>
                      </div>
                    )}
                    {profile.links?.codeforces && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-semibold">Codeforces</p>
                          <p className="text-sm text-muted-foreground">
                            {formatExternalHandle(profile.links.codeforces)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={buildHandleUrl("codeforces", profile.links.codeforces)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="mr-1 h-4 w-4" />
                            View
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
