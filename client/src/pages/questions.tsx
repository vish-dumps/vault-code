import { useState } from "react";
import { useLocation } from "wouter";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

//todo: remove mock functionality
const mockQuestions = [
  {
    id: "1",
    title: "Two Sum",
    platform: "LeetCode",
    difficulty: "Easy" as const,
    tags: ["Array", "Hash Table"],
    language: "Python",
    link: "https://leetcode.com/problems/two-sum",
  },
  {
    id: "2",
    title: "Longest Palindromic Substring",
    platform: "LeetCode",
    difficulty: "Medium" as const,
    tags: ["String", "Dynamic Programming"],
    language: "C++",
    link: "https://leetcode.com/problems/longest-palindromic-substring",
  },
  {
    id: "3",
    title: "Median of Two Sorted Arrays",
    platform: "LeetCode",
    difficulty: "Hard" as const,
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    language: "Java",
    link: "https://leetcode.com",
  },
  {
    id: "4",
    title: "Valid Parentheses",
    platform: "LeetCode",
    difficulty: "Easy" as const,
    tags: ["String", "Stack"],
    language: "JavaScript",
    link: "https://leetcode.com",
  },
];

export default function Questions() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const filteredQuestions = mockQuestions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === "all" || q.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
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
        <Button onClick={() => console.log("Add question")} data-testid="button-add-question">
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

      <div className="space-y-3">
        {filteredQuestions.map((question) => (
          <QuestionCard
            key={question.id}
            {...question}
            onEdit={(id) => console.log("Edit", id)}
            onDelete={(id) => console.log("Delete", id)}
            onClick={(id) => setLocation(`/questions/${id}`)}
          />
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions found</p>
        </div>
      )}
    </div>
  );
}
