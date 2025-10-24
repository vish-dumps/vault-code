import { CheckCircle, Flame, TrendingUp, Plus } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { TopicChart } from "@/components/topic-chart";
import { ContestList } from "@/components/contest-list";
import { Button } from "@/components/ui/button";

//todo: remove mock functionality
const mockTopicData = [
  { topic: "Arrays", solved: 45 },
  { topic: "Strings", solved: 32 },
  { topic: "DP", solved: 28 },
  { topic: "Graphs", solved: 21 },
  { topic: "Trees", solved: 30 },
];

//todo: remove mock functionality
const mockContests = [
  {
    id: "1",
    name: "Codeforces Round #912 (Div. 2)",
    platform: "Codeforces",
    startTime: "Oct 25, 2025 at 8:35 PM",
    url: "https://codeforces.com",
  },
  {
    id: "2",
    name: "Weekly Contest 419",
    platform: "LeetCode",
    startTime: "Oct 27, 2025 at 10:00 AM",
    url: "https://leetcode.com",
  },
  {
    id: "3",
    name: "CodeChef Starters 110",
    platform: "CodeChef",
    startTime: "Oct 28, 2025 at 8:00 PM",
    url: "https://codechef.com",
  },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your coding progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Problems Solved"
          value={156}
          icon={CheckCircle}
          trend="+12 this week"
        />
        <StatsCard title="Current Streak" value="23 days" icon={Flame} />
        <StatsCard
          title="Top Topic"
          value="Arrays"
          icon={TrendingUp}
          trend="45 problems"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopicChart data={mockTopicData} />
        </div>
        <div>
          <ContestList contests={mockContests} />
        </div>
      </div>

      <Button
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => console.log("Add question triggered")}
        data-testid="button-quick-add"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
