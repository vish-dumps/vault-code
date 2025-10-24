import { useState } from "react";
import { CodeEditor } from "@/components/code-editor";
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

export default function Workspace() {
  const [code, setCode] = useState(
    `// Start coding here...

function example() {
  console.log("Hello, CodeVault!");
}`
  );
  const [language, setLanguage] = useState("javascript");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    console.log("Saving snippet:", { title, language, code, notes });
    // todo: remove mock functionality - replace with actual save
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
            height="calc(100vh - 300px)"
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
                  className="min-h-32"
                  data-testid="textarea-snippet-notes"
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
