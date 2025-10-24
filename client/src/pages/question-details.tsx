import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, Edit, Plus, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuestionWithDetails } from "@shared/schema";

const difficultyColors = {
  Easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  Medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function QuestionDetails() {
  const [, params] = useRoute("/questions/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedApproach, setSelectedApproach] = useState<string | null>(null);
  const [isAddingApproach, setIsAddingApproach] = useState(false);
  const [newApproachName, setNewApproachName] = useState("");
  const [newApproachLanguage, setNewApproachLanguage] = useState("cpp");
  const [newApproachCode, setNewApproachCode] = useState("");
  const [newApproachNotes, setNewApproachNotes] = useState("");

  const { data: question, isLoading } = useQuery<QuestionWithDetails>({
    queryKey: ["/api/questions", params?.id],
    enabled: !!params?.id,
  });

  const createApproachMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/questions/${params?.id}/approaches`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", params?.id] });
      toast({
        title: "Success",
        description: "Approach added successfully",
      });
      setIsAddingApproach(false);
      setNewApproachName("");
      setNewApproachCode("");
      setNewApproachNotes("");
      setNewApproachLanguage("cpp");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add approach",
        variant: "destructive",
      });
    },
  });

  const handleAddApproach = () => {
    setIsAddingApproach(true);
    setSelectedApproach(null);
    setNewApproachName("");
    setNewApproachCode("");
    setNewApproachNotes("");
    setNewApproachLanguage("cpp");
  };

  const handleSaveApproach = () => {
    if (!newApproachName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an approach name",
        variant: "destructive",
      });
      return;
    }
    createApproachMutation.mutate({
      name: newApproachName,
      language: newApproachLanguage,
      code: newApproachCode,
      notes: newApproachNotes || undefined,
    });
  };

  const handleCancelAddApproach = () => {
    setIsAddingApproach(false);
    setSelectedApproach(question?.approaches[0]?.id?.toString() || null);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">Question not found</div>
      </div>
    );
  }

  const currentApproachId = selectedApproach || question.approaches[0]?.id?.toString();
  const currentApproach = question.approaches.find(
    (a) => a.id?.toString() === currentApproachId
  );

  return (
    <div className="h-screen flex">
      {/* Left side - Problem description */}
      <div className="w-1/2 h-full overflow-y-auto border-r">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation("/questions")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
            
            <div className="flex gap-2">
              {question.link && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(question.link || "", "_blank")}
                  data-testid="button-open-link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                                    onClick={() => setLocation(`/questions/edit/${question.id}`)}
                data-testid="button-edit-question"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-3">{question.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{question.platform}</Badge>
                <Badge
                  className={
                    difficultyColors[question.difficulty as keyof typeof difficultyColors]
                  }
                >
                  {question.difficulty}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {question.link && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Problem Link</h3>
                  <a
                    href={question.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {question.link}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {question.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Question Notes</h3>
                  <p className="text-sm text-muted-foreground">{question.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Your Approaches</h3>
              </div>

              {question.approaches.length > 0 && (
                <Tabs
                  value={currentApproachId}
                  onValueChange={setSelectedApproach}
                >
                  <TabsList className="w-full">
                    {question.approaches.map((approach) => (
                      <TabsTrigger
                        key={approach.id}
                        value={approach.id.toString()}
                        className="flex-1"
                        data-testid={`tab-approach-${approach.id}`}
                      >
                        {approach.name || approach.language}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              {currentApproach?.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Approach Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentApproach.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Code editor */}
      <div className="w-1/2 h-full flex flex-col">
        {isAddingApproach ? (
          <>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddApproach}
                disabled
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Approach
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAddApproach}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveApproach}
                  disabled={createApproachMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createApproachMutation.isPending ? "Saving..." : "Save Approach"}
                </Button>
              </div>
            </div>
            <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto min-h-0">
              <div>
                <label className="text-sm font-medium mb-2 block">Approach Name</label>
                <Input
                  value={newApproachName}
                  onChange={(e) => setNewApproachName(e.target.value)}
                  placeholder="e.g., Hash Map Solution, Two Pointers"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                <Textarea
                  value={newApproachNotes}
                  onChange={(e) => setNewApproachNotes(e.target.value)}
                  placeholder="Add notes about this approach..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <label className="text-sm font-medium">Code Editor</label>
                  <Select value={newApproachLanguage} onValueChange={setNewApproachLanguage}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CodeEditor
                    value={newApproachCode}
                    onChange={(value) => setNewApproachCode(value || "")}
                    language={newApproachLanguage}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </>
        ) : question.approaches.length > 0 ? (
          <>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddApproach}
                data-testid="button-add-approach"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Approach
              </Button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {question.approaches.map((approach) => (
                <div
                  key={approach.id}
                  className={approach.id.toString() === currentApproachId ? "flex-1 flex flex-col min-h-0" : "hidden"}
                >
                  <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <span className="font-medium">Code Editor</span>
                    <span className="text-sm text-muted-foreground">
                      Language: {approach.language}
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden p-4">
                    <CodeEditor
                      value={approach.code}
                      language={approach.language}
                      height="100%"
                      readOnly
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddApproach}
                data-testid="button-add-approach"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Approach
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No solutions added yet. Click "Add Approach" to add one.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
