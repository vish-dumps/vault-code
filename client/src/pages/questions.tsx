import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { QuestionCard } from "@/components/question-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCachedFetch } from "@/hooks/useCachedFetch";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import type { QuestionWithDetails } from "@shared/schema";
import { tagsMatchQuery } from "@/lib/tagTaxonomy";

export default function Questions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");

  const { data, isLoading, refetch } = useCachedFetch<QuestionWithDetails[]>("/api/questions", {
    cacheKey: "questions_list"
  });
  const questions = data || [];

  const toTimestamp = (value: QuestionWithDetails["dateSaved"]) => {
    if (!value) return 0;
    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    const diff = toTimestamp(b.dateSaved) - toTimestamp(a.dateSaved);
    if (diff !== 0) return diff;
    const idB = typeof b.id === "number" ? b.id : parseInt(String(b.id), 10) || 0;
    const idA = typeof a.id === "number" ? a.id : parseInt(String(a.id), 10) || 0;
    return idB - idA;
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: "Success", description: "Question deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
    },
  });

  // Get all unique tags from questions
  const allTags = Array.from(new Set(sortedQuestions.flatMap((q) => q.tags || [])));

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const normalizedTagFilter = tagFilter.trim();

  const filteredQuestions = sortedQuestions.filter((q) => {
    const matchesSearch =
      !normalizedSearch ||
      q.title.toLowerCase().includes(normalizedSearch) ||
      tagsMatchQuery(q.tags, normalizedSearch);
    const matchesDifficulty =
      difficultyFilter === "all" || q.difficulty === difficultyFilter;
    const matchesTag =
      !normalizedTagFilter || tagsMatchQuery(q.tags, normalizedTagFilter);

    return matchesSearch && matchesDifficulty && matchesTag;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Vault</h1>
          <p className="text-muted-foreground mt-1">
            Your saved coding problems
          </p>
        </div>
        <Button
          onClick={() => setLocation("/questions/add")}
          data-testid="button-add-question"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-questions"
          />
        </div>
        <Input
          placeholder="Filter by tag..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-full sm:w-48"
          data-testid="input-tag-filter"
        />
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-difficulty-filter">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tagFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by tag:</span>
          <Badge variant="secondary" className="gap-1">
            {tagFilter}
            <button onClick={() => setTagFilter("")} className="ml-1 hover:text-destructive">
              ×
            </button>
          </Badge>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              id={question.id.toString()}
              title={question.title}
              platform={question.platform}
              difficulty={question.difficulty as "Easy" | "Medium" | "Hard"}
              tags={question.tags}
              language={question.approaches[0]?.language || "N/A"}
              link={question.link || undefined}
              onEdit={(id) => setLocation(`/questions/${id}`)}
              onDelete={(id) => deleteQuestionMutation.mutate(id)}
              onClick={(id) => setLocation(`/questions/${id}`)}
            />
          ))}
        </div>
      )}

      {filteredQuestions.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions found</p>
        </div>
      )}


    </div>
  );
}
