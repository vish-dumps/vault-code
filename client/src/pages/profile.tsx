import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, Link as LinkIcon, RefreshCw, Upload, Sparkles, Rocket, Zap, ArrowRight, Pencil, Loader2 } from "lucide-react";
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
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { toTitleCase } from "@/lib/text";
import type { QuestionWithDetails, TopicProgress } from "@shared/schema";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codeforcesUsername, setCodeforcesUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [avatarType, setAvatarType] = useState<'initials' | 'random' | 'custom'>('initials');
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [randomAvatarSeed, setRandomAvatarSeed] = useState<number>(Date.now());
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB cap to keep base64 reasonable

  const highlightCards = [
    {
      title: "Unlock the CodeVault Playbook",
      description:
        "Follow a guided loop for capturing, organising, and executing your practice sessions without losing momentum.",
      icon: Sparkles,
      accent: "from-purple-500/30 via-fuchsia-500/20 to-sky-500/20",
      badge: "New",
      destination: "/guide",
      cta: "View usage guide",
    },
    {
      title: "Plan your next focused sprint",
      description:
        "Move into the Workspace with snippets, todos, and multi-file layouts designed for rapid rehearsal.",
      icon: Rocket,
      accent: "from-emerald-500/25 via-teal-500/20 to-cyan-500/25",
      destination: "/workspace",
      cta: "Open workspace",
    },
    {
      title: "Automate your learning loops",
      description:
        "Create snippet libraries and leverage semantic tags so you can recall solutions faster each session.",
      icon: Zap,
      accent: "from-amber-500/25 via-orange-500/20 to-rose-500/20",
      destination: "/snippets",
      cta: "Review snippets",
    },
  ];

  // Fetch user profile
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Fetch questions for stats
  const { data: questions = [] } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/questions"],
    refetchInterval: 30000,
  });

  // Fetch topic progress for graph
  const { data: topicProgress = [] } = useQuery<TopicProgress[]>({
    queryKey: ["/api/topics"],
    refetchInterval: 60000,
  });

  // Fetch todos for productivity metrics
  const { data: todos = [] } = useQuery<any[]>({
    queryKey: ["/api/todos"],
    refetchInterval: 30000,
  });

  // Update local state when user profile loads (only once)
  useEffect(() => {
    if (userProfile && !isInitialized) {
      setLeetcodeUsername(userProfile.leetcodeUsername || "");
      setCodeforcesUsername(userProfile.codeforcesUsername || "");
      setFullName(userProfile.name || "");
      setUsernameValue(userProfile.username || "");
      setEmail(userProfile.email || "");
      const storedProfileImage = userProfile.profileImage || "";
      setProfileImage(storedProfileImage);
      
      // Initialize avatar state from database
      setAvatarType(userProfile.avatarType || 'initials');
      setAvatarGender(userProfile.avatarGender || 'male');
      setCustomAvatarUrl(userProfile.customAvatarUrl || "");
      setRandomAvatarSeed(userProfile.randomAvatarSeed ?? Date.now());
      
      setIsInitialized(true);
    }
  }, [userProfile, isInitialized]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      const result = await response.json();
      return result;
    },
    onSuccess: (updatedUser: any) => {
      if (updatedUser) {
        setLeetcodeUsername(updatedUser.leetcodeUsername || "");
        setCodeforcesUsername(updatedUser.codeforcesUsername || "");
        setFullName(updatedUser.name || "");
        setUsernameValue(updatedUser.username || "");
        setEmail(updatedUser.email || "");
        setAvatarType(updatedUser.avatarType || "initials");
        setAvatarGender(updatedUser.avatarGender || "male");
        setCustomAvatarUrl(updatedUser.customAvatarUrl || "");
        setProfileImage(updatedUser.profileImage || "");
        if (typeof updatedUser.randomAvatarSeed === "number") {
          setRandomAvatarSeed(updatedUser.randomAvatarSeed);
        }
        updateUser({
          name: updatedUser.name ?? undefined,
          username: updatedUser.username ?? usernameValue,
          email: updatedUser.email ?? email,
          avatarType: updatedUser.avatarType ?? avatarType,
          avatarGender: updatedUser.avatarGender ?? avatarGender,
          customAvatarUrl: updatedUser.customAvatarUrl ?? null,
          profileImage: updatedUser.profileImage ?? null,
          randomAvatarSeed:
            typeof updatedUser.randomAvatarSeed === "number"
              ? updatedUser.randomAvatarSeed
              : undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const normalizeDateKey = (value: string | Date | null | undefined) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().split("T")[0];
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageUpload = (file: File) => {
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast({
        title: "Image too large",
        description: "Please choose an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfileImage(result);
      setCustomAvatarUrl("");
      setAvatarType("custom");
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleProfileImageUpload(file);
    }
    // Allow re-selecting the same file
    event.target.value = "";
  };

  const handleSave = () => {
    const payload: Record<string, any> = {
      leetcodeUsername: leetcodeUsername.trim() || undefined,
      codeforcesUsername: codeforcesUsername.trim() || undefined,
      avatarType,
      avatarGender,
    };

    if (avatarType === "random") {
      payload.randomAvatarSeed = randomAvatarSeed;
      payload.profileImage = null;
      payload.customAvatarUrl = null;
    } else if (avatarType === "custom") {
      payload.randomAvatarSeed = null;
      if (profileImage) {
        payload.profileImage = profileImage;
        payload.customAvatarUrl = null;
      } else if (customAvatarUrl) {
        payload.profileImage = null;
        payload.customAvatarUrl = customAvatarUrl.trim() || null;
      } else {
        payload.profileImage = null;
        payload.customAvatarUrl = null;
      }
    } else {
      payload.randomAvatarSeed = null;
      payload.profileImage = null;
      payload.customAvatarUrl = null;
    }

    saveProfileMutation.mutate(payload, {
      onSuccess: () => {
        setIsAccountDialogOpen(false);
      },
    });
  };

  const handleGenerateNewAvatar = () => {
    setRandomAvatarSeed(Date.now());
    setAvatarType("random");
    setProfileImage("");
    setCustomAvatarUrl("");
  };

  const handleResetAvatar = () => {
    setAvatarType("initials");
    setProfileImage("");
    setCustomAvatarUrl("");
  };

  const handleSaveAccountInfo = () => {
    const trimmedName = fullName.trim();
    const trimmedUsername = usernameValue.trim();

    if (!trimmedUsername) {
      toast({
        title: "Username required",
        description: "Please choose a username to display on your profile.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      toast({
        title: "Username length",
        description: "Username should be between 3 and 30 characters.",
        variant: "destructive",
      });
      return;
    }

    const payload: Record<string, any> = {};
    if (trimmedName !== (userProfile?.name || "")) {
      payload.name = trimmedName;
    }
    if (trimmedUsername !== (userProfile?.username || "")) {
      payload.username = trimmedUsername;
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: "No changes detected",
        description: "Update your name or username before saving.",
      });
      return;
    }

    saveProfileMutation.mutate(payload);
  };

  const getAvatarUrl = () => {
    if (avatarType === "custom") {
      if (profileImage) {
        return profileImage;
      }
      if (customAvatarUrl) {
        return customAvatarUrl;
      }
    }
    if (avatarType === "random") {
      // Use the correct API format: /public/boy or /public/girl with seed as query param
      const genderPath = avatarGender === "male" ? "boy" : "girl";
      return `https://avatar.iran.liara.run/public/${genderPath}?username=${randomAvatarSeed}`;
    }
    return null;
  };

  const todayKey = normalizeDateKey(new Date());

  const formattedProfileName = useMemo(() => {
    if (userProfile?.name && userProfile.name.trim().length > 0) {
      return toTitleCase(userProfile.name);
    }
    return userProfile?.username || "User";
  }, [userProfile?.name, userProfile?.username]);

  const heatmapData = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((question) => {
      const key = normalizeDateKey(question.dateSaved);
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const results: Array<{ date: string; count: number }> = [];

    for (let i = 364; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = normalizeDateKey(day);
      results.push({ date: key, count: key ? counts.get(key) ?? 0 : 0 });
    }

    return results;
  }, [questions]);

  const dailyActivityData = useMemo(() => {
    const dateCountMap = new Map<string, number>();

    questions.forEach((question) => {
      const key = normalizeDateKey(question.dateSaved);
      if (key) {
        dateCountMap.set(key, (dateCountMap.get(key) || 0) + 1);
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = normalizeDateKey(date);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      data.push({
        date: label,
        problems: key ? dateCountMap.get(key) || 0 : 0,
      });
    }

    return data;
  }, [questions]);

  const todoHistory = useMemo(() => {
    const stats = new Map<string, { added: number; completed: number }>();

    todos.forEach((todo) => {
      const createdKey = normalizeDateKey(todo.createdAt);
      if (!createdKey) return;

    const createdEntry = stats.get(createdKey) ?? { added: 0, completed: 0 };
    createdEntry.added += 1;

    if (todo.completed) {
      const completionKey = normalizeDateKey(todo.completedAt || todo.createdAt);
      if (completionKey) {
        if (completionKey === createdKey) {
          createdEntry.completed += 1;
        } else {
          const completionEntry = stats.get(completionKey) ?? { added: 0, completed: 0 };
          completionEntry.completed += 1;
          stats.set(completionKey, completionEntry);
        }
      } else {
        createdEntry.completed += 1;
      }
    }

      stats.set(createdKey, createdEntry);
    });

    if (todayKey) {
      const todayEntry = stats.get(todayKey) ?? { added: 0, completed: 0 };
      stats.set(todayKey, todayEntry);
    }

    return Array.from(stats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));
  }, [todos, todayKey]);

  const todayStats = todoHistory.find((stat) => stat.date === todayKey) ?? { added: 0, completed: 0 };
  const tasksAddedDaily = todayStats.added;
  const tasksCompletedDaily = todayStats.completed;
  const totalTasks = todos.length;

  // Calculate consistency metrics
  const currentStreak = userProfile?.streak || 0;
  const maxStreak = userProfile?.maxStreak || currentStreak;
  const activeDaysLast30 = heatmapData.slice(-30).filter((day) => day.count > 0).length;

  const fallbackLastActivity = useMemo(() => {
    const recent = [...heatmapData].reverse().find((day) => day.count > 0);
    return recent ? new Date(recent.date) : null;
  }, [heatmapData]);

  const daysSinceLastActivity = useMemo(() => {
    const baseDate = userProfile?.lastActiveDate ? new Date(userProfile.lastActiveDate) : fallbackLastActivity;
    if (!baseDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reference = new Date(baseDate);
    reference.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24)));
  }, [userProfile?.lastActiveDate, fallbackLastActivity]);

  const consistencyScore = useMemo(() => {
    const streakScore = maxStreak > 0 ? Math.min(100, (currentStreak / maxStreak) * 100) : currentStreak > 0 ? 100 : 0;
    const activityScore = (activeDaysLast30 / 30) * 100;
    const freshnessScore = Math.max(0, Math.min(100, 100 - daysSinceLastActivity * 10));
    const total = streakScore * 0.4 + activityScore * 0.4 + freshnessScore * 0.2;
    return parseFloat(total.toFixed(1));
  }, [currentStreak, maxStreak, activeDaysLast30, daysSinceLastActivity]);

  // Get user initials
  const getInitials = () => {
    const name = formattedProfileName;
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and connected platforms
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background/95 via-background/80 to-background/95 p-6 shadow-[0_25px_80px_-50px_rgba(124,58,237,0.45)]"
      >
        <div className="absolute -right-24 top-1/3 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute left-16 -top-24 h-32 w-48 -rotate-6 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 md:grid-cols-[1fr,1.4fr] md:items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-primary">
              <Sparkles className="h-3 w-3" />
              Guided Workflows
            </div>
            <h2 className="text-2xl font-semibold leading-tight">
              Pair your profile insights with action-ready routines.
            </h2>
            <p className="text-sm text-muted-foreground">
              Start with the usage guide to understand the practice loop, then jump straight into the workspace
              or snippets library to apply what you learn.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {highlightCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.title}
                  type="button"
                  onClick={() => setLocation(card.destination)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 text-left transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <div className={`pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br ${card.accent}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-border/60 bg-background/80 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold leading-snug">{card.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                      </div>
                    </div>
                    {card.badge && (
                      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                        {card.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                    {card.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1 min-w-0">
          <Card data-testid="card-user-info">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>User Information</CardTitle>
              <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit account details</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit account details</DialogTitle>
                    <DialogDescription>
                      Update how your name and username appear across CodeVault.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-full-name-dialog">Full Name</Label>
                      <Input
                        id="account-full-name-dialog"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={saveProfileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-username-dialog">Username</Label>
                      <Input
                        id="account-username-dialog"
                        placeholder="Choose a username"
                        value={usernameValue}
                        onChange={(e) => setUsernameValue(e.target.value)}
                        minLength={3}
                        maxLength={30}
                        disabled={saveProfileMutation.isPending}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your username is visible on leaderboards, shared workspaces, and invites.
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFullName(userProfile?.name || '');
                          setUsernameValue(userProfile?.username || '');
                          setIsAccountDialogOpen(false);
                        }}
                        disabled={saveProfileMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveAccountInfo}
                        disabled={saveProfileMutation.isPending}
                      >
                        {saveProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                    <div className="space-y-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative rounded-full p-[2px]">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/60 via-fuchsia-500/40 to-cyan-400/60 blur-lg" />
                          <div className="relative rounded-full bg-slate-900/80 p-1">
                            <Avatar className="h-24 w-24 ring-2 ring-purple-400/40 shadow-[0_24px_80px_rgba(124,58,237,0.35)]">
                              {getAvatarUrl() && <AvatarImage src={getAvatarUrl()!} alt="Avatar preview" />}
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-sky-500 text-white text-2xl font-semibold">
                                {getInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center max-w-xs">
                          Your avatar updates instantly as you upload, randomize, or reset.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Random avatar mood
                        </Label>
                        <Select
                          value={avatarGender}
                          onValueChange={(value) => setAvatarGender(value as "male" | "female")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Bold - Adventurous</SelectItem>
                            <SelectItem value="female">Vivid - Elegant</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          We use this preference whenever you generate a new CodeVault avatar.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileInputChange}
                        />
                        <Button onClick={triggerFileUpload} className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload a photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleGenerateNewAvatar}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate a new look
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-rose-500 hover:bg-rose-500/10"
                          onClick={handleResetAvatar}
                        >
                          Remove wallpaper
                        </Button>
                      </div>

                      {(profileImage || customAvatarUrl) && (
                        <p className="text-xs text-muted-foreground text-center">
                          Uploaded avatars stay private to your account. Max size 2&nbsp;MB.
                        </p>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            handleSave();
                            setIsAvatarDialogOpen(false);
                          }}
                        >
                          Save avatar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{formattedProfileName}</h3>
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

        <Card data-testid="card-account-details">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-full-name">Full Name</Label>
              <Input
                id="account-full-name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="input-account-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-username">Username</Label>
              <Input
                id="account-username"
                placeholder="Choose a username"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                minLength={3}
                maxLength={30}
                data-testid="input-account-username"
              />
              <p className="text-xs text-muted-foreground">
                This is how you appear across CodeVault. Letters, numbers, and underscores are allowed.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                value={email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFullName(userProfile?.name || "");
                  setUsernameValue(userProfile?.username || "");
                }}
                disabled={saveProfileMutation.isPending}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleSaveAccountInfo}
                disabled={saveProfileMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
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

          <ProductivityMetricsCard
            tasksAddedDaily={tasksAddedDaily}
            tasksCompletedDaily={tasksCompletedDaily}
            totalTasks={totalTasks}
            consistencyScore={consistencyScore}
            historicalStats={todoHistory}
          />
        </div>

        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Daily Activity Chart */}
          <DailyActivityChart data={dailyActivityData} />

          <ContributionHeatmap data={heatmapData} />

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

        </div>
      </div>
    </div>
  );
}
