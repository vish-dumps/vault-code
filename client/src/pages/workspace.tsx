import { useState, useEffect } from "react";
import { CodeEditor } from "@/components/code-editor";
import { codeTemplates } from "@/lib/codeTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TagInput } from "@/components/tag-input";

export default function Workspace() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(codeTemplates[language]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Only update code if it's empty or matches a template
    if (!code || Object.values(codeTemplates).includes(code)) {
      setCode(codeTemplates[language]);
    }
  }, [language]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the snippet",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/snippets", { title, language, code, notes, tags });
      
      toast({
        title: "Success",
        description: "Snippet saved successfully!",
      });
      
      // Clear the form
      setTitle("");
      setCode(codeTemplates[language]);
      setNotes("");
      setTags([]);
    } catch (error) {
      console.error("Failed to save snippet:", error);
      toast({
        title: "Error",
        description: "Failed to save snippet. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Write and save your code snippets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Code Editor</span>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-48" data-testid="select-workspace-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="go">Go</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CodeEditor
            value={code}
            language={language}
            onChange={(value) => setCode(value || "")}
            height="calc(100vh - 200px)"
          />
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Snippet Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Binary Search Implementation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-snippet-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this snippet..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-24"
                  data-testid="textarea-snippet-notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Type and press Enter to add tags..."
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                data-testid="button-save-snippet"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Snippet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
