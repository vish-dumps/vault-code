import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CheckCircle, Flame, TrendingUp, Plus, FileCode, Code2 } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { TopicChart } from "@/components/topic-chart";
import { ContestList } from "@/components/contest-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [, setLocation] = useLocation();

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

  // Fetch snippets count
  const { data: snippets = [] } = useQuery<any[]>({
    queryKey: ["/api/snippets"],
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <StatsCard
          title="Code Snippets"
          value={snippets.length}
          icon={FileCode}
          trend="Saved snippets"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicChart data={chartData} />
        <div className="space-y-6">
          <ContestList contests={contests} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Jump to your most used features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/workspace")}
              >
                <Code2 className="h-4 w-4 mr-2" />
                Create New Snippet
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/snippets")}
              >
                <FileCode className="h-4 w-4 mr-2" />
                View All Snippets
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/questions/add")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Question
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
