import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, Link as LinkIcon, Camera } from "lucide-react";
import { SiLeetcode, SiCodeforces } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuestionWithDetails } from "@shared/schema";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ['#9B1BFA', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codeforcesUsername, setCodeforcesUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  // Fetch user profile
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Fetch questions for stats
  const { data: questions = [] } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/questions"],
  });

  // Fetch snippets
  const { data: snippets = [] } = useQuery<any[]>({
    queryKey: ["/api/snippets"],
  });

  // Update local state when user profile loads
  useEffect(() => {
    if (userProfile) {
      setLeetcodeUsername(userProfile.leetcodeUsername || "");
      setCodeforcesUsername(userProfile.codeforcesUsername || "");
      setProfileImage(userProfile.profileImage || "");
      setImagePreview(userProfile.profileImage || "");
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
      profileImage: profileImage.trim() || undefined,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get user initials
  const getInitials = () => {
    const name = userProfile?.name || userProfile?.username || "User";
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Prepare daily progress data (mock data for last 7 days)
  const dailyProgressData = [
    { day: 'Mon', problems: 3 },
    { day: 'Tue', problems: 5 },
    { day: 'Wed', problems: 4 },
    { day: 'Thu', problems: 6 },
    { day: 'Fri', problems: 8 },
    { day: 'Sat', problems: 7 },
    { day: 'Sun', problems: 9 },
  ];

  // Prepare topic distribution data
  const tagCounts: Record<string, number> = {};
  questions.forEach(q => {
    q.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topicDistributionData = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic, count]) => ({ topic, count }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and track your progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info & Connected Accounts */}
        <div className="space-y-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    {imagePreview ? (
                      <AvatarImage src={imagePreview} alt="Profile" />
                    ) : (
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-primary/10">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="profile-image"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-xl">
                    {userProfile?.name || userProfile?.username || "User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                  <div className="text-2xl font-bold text-primary">{questions.length}</div>
                  <div className="text-xs text-muted-foreground">Problems</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                  <div className="text-2xl font-bold text-orange-500">
                    {userProfile?.streak || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                  <div className="text-2xl font-bold text-purple-500">{snippets.length}</div>
                  <div className="text-xs text-muted-foreground">Snippets</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    {userProfile?.createdAt ? formatDate(userProfile.createdAt) : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  />
                  {leetcodeUsername && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(`https://leetcode.com/${leetcodeUsername}`, "_blank")
                      }
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                  />
                  {codeforcesUsername && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(
                          `https://codeforces.com/profile/${codeforcesUsername}`,
                          "_blank"
                        )
                      }
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Button className="w-full" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Graphs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Progress Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress</CardTitle>
              <p className="text-sm text-muted-foreground">Problems solved per day</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="problems" 
                    stroke="#9B1BFA" 
                    strokeWidth={3}
                    dot={{ fill: '#9B1BFA', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Topic Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Topic Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">Distribution of problems across topics</p>
            </CardHeader>
            <CardContent>
              {topicDistributionData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={topicDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {topicDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2">
                    {topicDistributionData.map((item, index) => (
                      <div key={item.topic} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{item.topic}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p>No topic data yet. Start solving problems with tags!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
