import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, Link as LinkIcon } from "lucide-react";
import { SiLeetcode, SiCodeforces } from "react-icons/si";

export default function Profile() {
  const [leetcodeUsername, setLeetcodeUsername] = useState("johndoe");
  const [codeforcesUsername, setCodeforcesUsername] = useState("john_coder");

  const handleSave = () => {
    console.log("Saving profile:", { leetcodeUsername, codeforcesUsername });
    // todo: remove mock functionality - replace with actual save
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
                  <AvatarFallback className="text-2xl">JD</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">John Doe</h3>
                  <p className="text-sm text-muted-foreground">
                    john@example.com
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Member since
                  </span>
                  <span className="text-sm font-medium">Jan 2025</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total problems
                  </span>
                  <span className="text-sm font-medium">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Current streak
                  </span>
                  <Badge variant="secondary">23 days</Badge>
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

          <Card data-testid="card-topic-stats">
            <CardHeader>
              <CardTitle>Topic Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { topic: "Arrays", count: 45 },
                  { topic: "Strings", count: 32 },
                  { topic: "Dynamic Programming", count: 28 },
                  { topic: "Graphs", count: 21 },
                  { topic: "Trees", count: 30 },
                ].map((stat) => (
                  <div
                    key={stat.topic}
                    className="p-3 rounded-md border"
                    data-testid={`topic-stat-${stat.topic.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.topic}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
