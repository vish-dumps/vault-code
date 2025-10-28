import { useState } from "react";
import { useLocation } from "wouter";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/tag-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function AddQuestion() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("LeetCode");
  const [difficulty, setDifficulty] = useState("Medium");
  const [link, setLink] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

  const addQuestion = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/questions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      setLocation("/questions");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addQuestion.mutate({
      title,
      platform,
      difficulty,
      link,
      tags,
      notes,
      approaches: code ? [{
        name: "Solution",
        language,
        code,
        notes: "",
      }] : [],
    });
  };

  return (
    <div className="h-screen flex">
      {/* Left side - Question details */}
      <div className="w-1/2 p-6 space-y-6 overflow-y-auto border-r">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Add Question</h1>
          <Button onClick={() => setLocation("/questions")}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Two Sum"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LeetCode">LeetCode</SelectItem>
                    <SelectItem value="CodeForces">CodeForces</SelectItem>
                    <SelectItem value="HackerRank">HackerRank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Problem Link</label>
              <Input 
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags</label>
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder="Type and press Enter to add tags..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this problem..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Save Question
          </Button>
        </form>
      </div>

      {/* Right side - Code editor */}
      <div className="w-1/2 h-full flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <span className="font-medium">Code Editor</span>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="go">Go</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeEditor
            value={code}
            onChange={(value) => setCode(value || "")}
            language={language}
            height="calc(100vh - 200px)"
          />
        </div>
      </div>
    </div>
  );
}
