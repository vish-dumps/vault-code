import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Flame, TrendingUp, Plus } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { TopicChart } from "@/components/topic-chart";
import { ContestList } from "@/components/contest-list";
import { AddQuestionDialog } from "@/components/add-question-dialog";
import { Button } from "@/components/ui/button";
import type { QuestionWithDetails, TopicProgress } from "@shared/schema";

interface Contest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  url: string;
}

export default function Dashboard() {
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);

  // Fetch questions to calculate stats
  const { data: questions = [] } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/questions"],
  });

  // Fetch contests
  const { data: contests = [] } = useQuery<Contest[]>({
    queryKey: ["/api/contests"],
  });

  // Fetch topic progress
  const { data: topicProgress = [] } = useQuery<TopicProgress[]>({
    queryKey: ["/api/topics"],
  });

  // Calculate stats from questions
  const totalProblems = questions.length;
  const topTopic = topicProgress.length > 0 
    ? topicProgress.reduce((max: TopicProgress, curr: TopicProgress) => 
        (curr.solved || 0) > (max.solved || 0) ? curr : max
      ).topic
    : "Arrays";

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your coding progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Problems Solved"
          value={totalProblems}
          icon={CheckCircle}
          trend={`+${Math.min(totalProblems, 12)} this week`}
        />
        <StatsCard 
          title="Current Streak" 
          value="23 days" 
          icon={Flame} 
        />
        <StatsCard
          title="Top Topic"
          value={topTopic}
          icon={TrendingUp}
          trend={`${topicProgress.find(t => t.topic === topTopic)?.solved || 0} problems`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopicChart data={chartData} />
        </div>
        <div>
          <ContestList contests={contests} />
        </div>
      </div>

      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setAddQuestionOpen(true)}
        data-testid="button-quick-add"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddQuestionDialog
        open={addQuestionOpen}
        onOpenChange={setAddQuestionOpen}
      />
    </div>
  );
}
