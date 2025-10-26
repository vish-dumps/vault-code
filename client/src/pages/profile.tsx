import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, Link as LinkIcon } from "lucide-react";
import { SiLeetcode, SiCodeforces } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TopicChart } from "@/components/topic-chart";
import type { QuestionWithDetails, TopicProgress } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codeforcesUsername, setCodeforcesUsername] = useState("");

  // Fetch user profile
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Fetch questions for stats
  const { data: questions = [] } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/questions"],
  });

  // Fetch topic progress for graph
  const { data: topicProgress = [] } = useQuery<TopicProgress[]>({
    queryKey: ["/api/topics"],
  });

  // Update local state when user profile loads
  useEffect(() => {
    if (userProfile) {
      setLeetcodeUsername(userProfile.leetcodeUsername || "");
      setCodeforcesUsername(userProfile.codeforcesUsername || "");
    }
  }, [userProfile]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveProfileMutation.mutate({
      leetcodeUsername: leetcodeUsername.trim() || undefined,
      codeforcesUsername: codeforcesUsername.trim() || undefined,
    });
  };

  // Format topic data for chart
  const chartData = topicProgress.length > 0 
    ? topicProgress.map((t: TopicProgress) => ({
        topic: t.topic,
        solved: t.solved || 0,
      }))
    : [
        { topic: "Arrays", solved: 0 },
        { topic: "Strings", solved: 0 },
        { topic: "DP", solved: 0 },
        { topic: "Graphs", solved: 0 },
        { topic: "Trees", solved: 0 },
      ];

  // Get user initials
  const getInitials = () => {
    const name = userProfile?.name || userProfile?.username || "User";
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and connected platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card data-testid="card-user-info">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{userProfile?.name || userProfile?.username || "User"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.email || "No email"}
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Member since
                  </span>
                  <span className="text-sm font-medium">
                    {userProfile?.createdAt ? formatDate(userProfile.createdAt) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total problems
                  </span>
                  <span className="text-sm font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Current streak
                  </span>
                  <Badge variant="secondary">{userProfile?.streak || 0} {userProfile?.streak === 1 ? 'day' : 'days'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card data-testid="card-connected-accounts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="leetcode" className="flex items-center gap-2">
                  <SiLeetcode className="h-4 w-4" />
                  LeetCode Username
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="leetcode"
                    placeholder="Enter LeetCode username"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    data-testid="input-leetcode-username"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://leetcode.com/${leetcodeUsername}`,
                        "_blank"
                      )
                    }
                    data-testid="button-view-leetcode"
                  >
                    View
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect your LeetCode account to track your progress
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codeforces" className="flex items-center gap-2">
                  <SiCodeforces className="h-4 w-4" />
                  Codeforces Username
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="codeforces"
                    placeholder="Enter Codeforces username"
                    value={codeforcesUsername}
                    onChange={(e) => setCodeforcesUsername(e.target.value)}
                    data-testid="input-codeforces-username"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://codeforces.com/profile/${codeforcesUsername}`,
                        "_blank"
                      )
                    }
                    data-testid="button-view-codeforces"
                  >
                    View
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect your Codeforces account to view contest history
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                data-testid="button-save-profile"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <TopicChart data={chartData} />

          <Card data-testid="card-topic-stats">
            <CardHeader>
              <CardTitle>Topic Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {topicProgress.length > 0 ? (
                  topicProgress.map((stat) => (
                    <div
                      key={stat.topic}
                      className="p-3 rounded-md border"
                      data-testid={`topic-stat-${stat.topic.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="text-2xl font-bold">{stat.solved || 0}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.topic}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-muted-foreground py-8">
                    No topic data yet. Start solving problems!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
