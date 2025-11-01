import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Trash2, RotateCcw, ShieldCheck, Bell, BarChart3, Users2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type SettingsResponse = {
  profileVisibility: "public" | "friends";
  friendRequestPolicy: "anyone" | "auto_mutual" | "disabled";
  searchVisibility: "public" | "hidden";
  notificationPreferences?: {
    friendRequests?: boolean;
    activityVisibility?: "friends" | "private";
  } | null;
  xpVisibility?: "public" | "private" | null;
  showProgressGraphs?: boolean | null;
  streakReminders?: boolean | null;
};

export default function Settings() {
  const { toast } = useToast();
  const { logout } = useAuth();

  const { data, isLoading } = useQuery<SettingsResponse>({
    queryKey: ["/api/user/profile"],
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<SettingsResponse>) => {
      const response = await apiRequest("PATCH", "/api/user/profile", payload);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Unable to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({ title: "Settings updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update settings", description: error.message, variant: "destructive" });
    },
  });

  const preferences = useMemo(() => {
    return {
      friendRequests: data?.notificationPreferences?.friendRequests ?? true,
      activityVisibility: data?.notificationPreferences?.activityVisibility ?? "friends",
    } as Required<NonNullable<SettingsResponse["notificationPreferences"]>>;
  }, [data]);

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/export");
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to export data");
      }
      return response.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: (payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `codevault-export-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded" });
    },
    onError: (error: Error) => {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/reset");
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to reset progress");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({ title: "Progress reset", description: "Your vault is squeaky clean again." });
    },
    onError: (error: Error) => {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/user");
      if (!response.ok && response.status !== 204) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to delete account");
      }
    },
    onSuccess: () => {
      toast({ title: "Account deleted", description: "We hope to see you again soon." });
      logout();
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading your preferences...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggle = (key: keyof SettingsResponse, value: string | boolean) => {
    updateMutation.mutate({ [key]: value } as Partial<SettingsResponse>);
  };

  const handleNotificationToggle = (value: Partial<NonNullable<SettingsResponse["notificationPreferences"]>>) => {
    updateMutation.mutate({
      notificationPreferences: {
        ...preferences,
        ...value,
      },
    });
  };

  const handleResetProgress = () => {
    if (resetMutation.isPending) return;
    const confirmed = window.confirm("Reset your questions, snippets, and streaks? This cannot be undone.");
    if (!confirmed) return;
    resetMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (deleteMutation.isPending) return;
    const promptText = window.prompt("Type DELETE to confirm account removal.");
    if (promptText !== "DELETE") {
      toast({ title: "Deletion cancelled", description: "Account removal requires typing DELETE." });
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Control how friends discover and interact with you, and fine-tune CodeVault to match your workflow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-primary" />
              Privacy & Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Profile visibility</Label>
              <RadioGroup
                defaultValue={data.profileVisibility}
                onValueChange={(value) => handleToggle("profileVisibility", value as SettingsResponse["profileVisibility"])}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2 rounded border p-2">
                  <RadioGroupItem value="public" id="profile-public" />
                  <Label htmlFor="profile-public" className="flex-1 cursor-pointer">
                    Public - show your profile to everyone
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded border p-2">
                  <RadioGroupItem value="friends" id="profile-friends" />
                  <Label htmlFor="profile-friends" className="flex-1 cursor-pointer">
                    Friends only - visible after connection
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-semibold">Friend request policy</Label>
              <RadioGroup
                defaultValue={data.friendRequestPolicy}
                onValueChange={(value) => handleToggle("friendRequestPolicy", value as SettingsResponse["friendRequestPolicy"])}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2 rounded border p-2">
                  <RadioGroupItem value="anyone" id="requests-anyone" />
                  <Label htmlFor="requests-anyone" className="flex-1 cursor-pointer">
                    Allow anyone
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded border p-2">
                  <RadioGroupItem value="auto_mutual" id="requests-mutual" />
                  <Label htmlFor="requests-mutual" className="flex-1 cursor-pointer">
                    Auto-approve mutual friends
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded border p-2">
                  <RadioGroupItem value="disabled" id="requests-disabled" />
                  <Label htmlFor="requests-disabled" className="flex-1 cursor-pointer">
                    Disable new requests
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between rounded border p-3">
              <div>
                <Label className="text-sm font-semibold">Search visibility</Label>
                <p className="text-xs text-muted-foreground">Let others discover you in CodeVault search.</p>
              </div>
              <Switch
                checked={data.searchVisibility !== "hidden"}
                onCheckedChange={(value) => handleToggle("searchVisibility", value ? "public" : "hidden")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications & Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded border p-3">
              <div>
                <Label className="text-sm font-semibold">Friend request notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when someone sends or accepts a friend request.
                </p>
              </div>
              <Switch
                checked={preferences.friendRequests}
                onCheckedChange={(value) => handleNotificationToggle({ friendRequests: value })}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Share activity updates</Label>
              <RadioGroup
                defaultValue={preferences.activityVisibility}
                onValueChange={(value) => handleNotificationToggle({ activityVisibility: value as "friends" | "private" })}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2 rounded border p-2">
                  <RadioGroupItem value="friends" id="activity-friends" />
                  <Label htmlFor="activity-friends" className="flex-1 cursor-pointer">
                    Friends - share milestones with your circle
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded border p-2">
                  <RadioGroupItem value="private" id="activity-private" />
                  <Label htmlFor="activity-private" className="flex-1 cursor-pointer">
                    Private - keep achievements to yourself
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Gamification preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <Label className="text-sm font-semibold">Show XP publicly</Label>
              <p className="text-xs text-muted-foreground">Display your XP total on your profile and leaderboards.</p>
            </div>
            <Switch
              checked={data.xpVisibility !== "private"}
              onCheckedChange={(value) => handleToggle("xpVisibility", value ? "public" : "private")}
            />
          </div>
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <Label className="text-sm font-semibold">Weekly progress graphs</Label>
              <p className="text-xs text-muted-foreground">Allow friends to see your week-over-week progress charts.</p>
            </div>
            <Switch
              checked={data.showProgressGraphs ?? true}
              onCheckedChange={(value) => handleToggle("showProgressGraphs", value)}
            />
          </div>
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <Label className="text-sm font-semibold">Daily streak reminders</Label>
              <p className="text-xs text-muted-foreground">Get nudges when you're close to losing a streak.</p>
            </div>
            <Switch
              checked={data.streakReminders ?? true}
              onCheckedChange={(value) => handleToggle("streakReminders", value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Data & account control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => downloadMutation.mutate()}
              disabled={downloadMutation.isPending}
            >
              <Download className="h-4 w-4" />
              {downloadMutation.isPending ? "Preparing export..." : "Download my data"}
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={handleResetProgress}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              {resetMutation.isPending ? "Resetting progress..." : "Reset progress"}
            </Button>
            <Button variant="outline" className="justify-start gap-2" disabled>
              <ShieldCheck className="h-4 w-4" />
              Change password / 2FA (coming soon)
            </Button>
            <Button
              variant="destructive"
              className="justify-start gap-2"
              onClick={handleDeleteAccount}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete my account"}
            </Button>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Export provides a JSON snapshot of your questions, snippets, activities, and answers. Reset clears your vault
            while keeping friends and settings intact. Account deletion permanently removes all stored data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
