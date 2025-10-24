import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CodeEditor } from "@/components/code-editor";
import { AddApproachDialog } from "@/components/add-approach-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, Edit, Plus } from "lucide-react";
import type { QuestionWithDetails } from "@shared/schema";

const difficultyColors = {
  Easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  Medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function QuestionDetails() {
  const [, params] = useRoute("/questions/:id");
  const [, setLocation] = useLocation();
  const [selectedApproach, setSelectedApproach] = useState<string | null>(null);
  const [addApproachOpen, setAddApproachOpen] = useState(false);

  const { data: question, isLoading } = useQuery<QuestionWithDetails>({
    queryKey: ["/api/questions", params?.id],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-6">
        <div className="text-center">Question not found</div>
      </div>
    );
  }

  const currentApproachId = selectedApproach || question.approaches[0]?.id?.toString();
  const currentApproach = question.approaches.find(
    (a) => a.id?.toString() === currentApproachId
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
        {/* LEFT SIDE - Question Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-3">
                    {question.title}
                  </CardTitle>
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
                    <p className="text-sm text-muted-foreground">
                      {question.notes}
                    </p>
                  </div>
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
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE - Code Solutions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Solutions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddApproachOpen(true)}
                  data-testid="button-add-approach"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Approach
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {question.approaches.length > 0 ? (
                <Tabs
                  value={currentApproachId}
                  onValueChange={setSelectedApproach}
                >
                  <TabsList className="w-full mb-4">
                    {question.approaches.map((approach) => (
                      <TabsTrigger
                        key={approach.id}
                        value={approach.id.toString()}
                        className="flex-1"
                        data-testid={`tab-approach-${approach.id}`}
                      >
                        {approach.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {question.approaches.map((approach) => (
                    <TabsContent key={approach.id} value={approach.id.toString()}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Language: {approach.language}
                          </span>
                        </div>
                        <CodeEditor
                          value={approach.code}
                          language={approach.language}
                          height="500px"
                          readOnly
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No solutions added yet. Click "Add Approach" to add one.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddApproachDialog
        open={addApproachOpen}
        onOpenChange={setAddApproachOpen}
        questionId={parseInt(params?.id || "0")}
      />
    </div>
  );
}
