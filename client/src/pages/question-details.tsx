import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Edit, Plus } from "lucide-react";

//todo: remove mock functionality
const mockQuestion = {
  id: "1",
  title: "Two Sum",
  platform: "LeetCode",
  difficulty: "Easy" as const,
  tags: ["Array", "Hash Table"],
  link: "https://leetcode.com/problems/two-sum",
  notes: "Remember to use a hash map for O(n) time complexity. The key insight is to store complements as we iterate.",
  approaches: [
    {
      id: "1",
      name: "Hash Map Approach",
      language: "Python",
      code: `def twoSum(nums, target):
    seen = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        if complement in seen:
            return [seen[complement], i]
        
        seen[num] = i
    
    return []`,
    },
    {
      id: "2",
      name: "Two Pointers (Sorted)",
      language: "JavaScript",
      code: `function twoSum(nums, target) {
  const indexed = nums.map((num, i) => [num, i]);
  indexed.sort((a, b) => a[0] - b[0]);
  
  let left = 0, right = nums.length - 1;
  
  while (left < right) {
    const sum = indexed[left][0] + indexed[right][0];
    
    if (sum === target) {
      return [indexed[left][1], indexed[right][1]];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }
  
  return [];
}`,
    },
  ],
};

const difficultyColors = {
  Easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  Medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function QuestionDetails() {
  const [, params] = useRoute("/questions/:id");
  const [, setLocation] = useLocation();
  const [selectedApproach, setSelectedApproach] = useState("1");
  const [language, setLanguage] = useState("python");

  const currentApproach = mockQuestion.approaches.find(
    (a) => a.id === selectedApproach
  );

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation("/questions")}
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Questions
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-3">
                    {mockQuestion.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{mockQuestion.platform}</Badge>
                    <Badge
                      className={difficultyColors[mockQuestion.difficulty]}
                    >
                      {mockQuestion.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(mockQuestion.link, "_blank")}
                    data-testid="button-open-link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => console.log("Edit question")}
                    data-testid="button-edit-question"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Tags</h3>
                  <div className="flex gap-2 flex-wrap">
                    {mockQuestion.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {mockQuestion.link && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Problem Link</h3>
                    <a
                      href={mockQuestion.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {mockQuestion.link}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    {mockQuestion.notes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Solutions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log("Add approach")}
                  data-testid="button-add-approach"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Approach
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedApproach} onValueChange={setSelectedApproach}>
                <TabsList className="w-full mb-4">
                  {mockQuestion.approaches.map((approach) => (
                    <TabsTrigger
                      key={approach.id}
                      value={approach.id}
                      className="flex-1"
                      data-testid={`tab-approach-${approach.id}`}
                    >
                      {approach.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {mockQuestion.approaches.map((approach) => (
                  <TabsContent key={approach.id} value={approach.id}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Language: {approach.language}
                        </span>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="w-36" data-testid="select-language">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <CodeEditor
                        value={approach.code}
                        language={approach.language}
                        height="400px"
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
