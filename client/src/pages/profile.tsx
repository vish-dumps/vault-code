import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, Link as LinkIcon, RefreshCw, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SiLeetcode, SiCodeforces } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DailyActivityChart } from "@/components/daily-activity-chart";
import { ConsistencyScoreCard } from "@/components/consistency-score-card";
import { ProductivityMetricsCard } from "@/components/productivity-metrics-card";
import { MilestonesCard } from "@/components/milestones-card";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import type { QuestionWithDetails, TopicProgress } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codeforcesUsername, setCodeforcesUsername] = useState("");
  const [avatarType, setAvatarType] = useState<'initials' | 'random' | 'custom'>('initials');
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [randomAvatarSeed, setRandomAvatarSeed] = useState<number>(Date.now());
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Fetch todos for productivity metrics
  const { data: todos = [] } = useQuery<any[]>({
    queryKey: ["/api/todos"],
  });

  // Update local state when user profile loads (only once)
  useEffect(() => {
    if (userProfile && !isInitialized) {
      setLeetcodeUsername(userProfile.leetcodeUsername || "");
      setCodeforcesUsername(userProfile.codeforcesUsername || "");
      
      // Initialize avatar state from database
      setAvatarType(userProfile.avatarType || 'initials');
      setAvatarGender(userProfile.avatarGender || 'male');
      setCustomAvatarUrl(userProfile.customAvatarUrl || "");
      setRandomAvatarSeed(userProfile.randomAvatarSeed || Date.now());
      
      setIsInitialized(true);
    }
  }, [userProfile, isInitialized]);

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
      avatarType,
      avatarGender,
      customAvatarUrl: customAvatarUrl.trim() || undefined,
      randomAvatarSeed,
    });
  };

  const handleGenerateNewAvatar = () => {
    setRandomAvatarSeed(Date.now());
  };

  const getAvatarUrl = () => {
    if (avatarType === 'custom' && customAvatarUrl) {
      return customAvatarUrl;
    }
    if (avatarType === 'random') {
      // Use the correct API format: /public/boy or /public/girl with seed as query param
      const genderPath = avatarGender === 'male' ? 'boy' : 'girl';
      return `https://avatar.iran.liara.run/public/${genderPath}?username=${randomAvatarSeed}`;
    }
    return null;
  };

  // Generate daily activity data from actual questions solved
  const getDailyActivityData = () => {
    const data = [];
    const today = new Date();
    
    // Create a map of dates to problem counts
    const dateCountMap = new Map<string, number>();
    
    questions.forEach((question) => {
      if (question.dateSaved) {
        const dateKey = new Date(question.dateSaved).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
      }
    });
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      data.push({
        date: dateKey,
        problems: dateCountMap.get(dateKey) || 0,
      });
    }
    return data;
  };

  const dailyActivityData = getDailyActivityData();

  // Calculate productivity metrics
  const todayTodos = todos.filter(t => {
    const todoDate = new Date(t.createdAt);
    const today = new Date();
    return todoDate.toDateString() === today.toDateString();
  });
  const tasksAddedDaily = todayTodos.length;
  const tasksCompletedDaily = todayTodos.filter(t => t.completed).length;
  
  // Calculate consistency metrics
  const currentStreak = userProfile?.streak || 0;
  const maxStreak = userProfile?.maxStreak || currentStreak;
  const activeDaysLast30 = 15; // Mock - calculate from actual data
  const daysSinceLastActivity = userProfile?.lastActiveDate 
    ? Math.floor((new Date().getTime() - new Date(userProfile.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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
        <div className="space-y-6 lg:col-span-1">
          <Card data-testid="card-user-info">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="relative cursor-pointer group">
                      <Avatar className="h-20 w-20">
                        {getAvatarUrl() && <AvatarImage src={getAvatarUrl()!} alt="Profile" />}
                        <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Avatar</DialogTitle>
                      <DialogDescription>Choose how you want your avatar to appear</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Avatar Type</Label>
                        <Select value={avatarType} onValueChange={(v: any) => setAvatarType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="initials">Initials</SelectItem>
                            <SelectItem value="random">Random Avatar</SelectItem>
                            <SelectItem value="custom">Custom URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {avatarType === 'random' && (
                        <>
                          <div>
                            <Label>Gender</Label>
                            <Select value={avatarGender} onValueChange={(v: any) => setAvatarGender(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={`https://avatar.iran.liara.run/public/${avatarGender === 'male' ? 'boy' : 'girl'}?username=${randomAvatarSeed}`} />
                              <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="sm" onClick={handleGenerateNewAvatar}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Generate New
                            </Button>
                          </div>
                        </>
                      )}

                      {avatarType === 'custom' && (
                        <div>
                          <Label>Image URL</Label>
                          <Input
                            value={customAvatarUrl}
                            onChange={(e) => setCustomAvatarUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                          />
                          {customAvatarUrl && (
                            <Avatar className="h-16 w-16 mt-2">
                              <AvatarImage src={customAvatarUrl} />
                              <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}

                      <Button onClick={() => { handleSave(); setIsAvatarDialogOpen(false); }} className="w-full">
                        Save Avatar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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

          {/* Contribution Heatmap */}
          <ContributionHeatmap />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Daily Activity Chart */}
          <DailyActivityChart data={dailyActivityData} />

          {/* Grid for Consistency and Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConsistencyScoreCard
              currentStreak={currentStreak}
              maxStreak={maxStreak}
              activeDaysLast30={activeDaysLast30}
              daysSinceLastActivity={daysSinceLastActivity}
            />
            <MilestonesCard />
          </div>

          {/* Productivity Metrics */}
          <ProductivityMetricsCard
            tasksAddedDaily={tasksAddedDaily}
            tasksCompletedDaily={tasksCompletedDaily}
            totalTasks={todos.length}
            consistencyScore={parseFloat(
              (((currentStreak / Math.max(maxStreak, 1)) * 100 * 0.4) +
              ((activeDaysLast30 / 30) * 100 * 0.4) +
              (Math.max(0, Math.min(100, 100 - (daysSinceLastActivity * 10))) * 0.2)).toFixed(1)
            )}
          />
        </div>
      </div>
    </div>
  );
}
