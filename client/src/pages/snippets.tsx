import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Code2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Snippet {
  id: number;
  title: string;
  language: string;
  code: string;
  notes?: string;
  createdAt: string;
}

export default function Snippets() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<number | null>(null);

  const { data: snippets = [], isLoading } = useQuery<Snippet[]>({
    queryKey: ["/api/snippets"],
    queryFn: async () => {
      const response = await fetch("/api/snippets");
      if (!response.ok) throw new Error("Failed to fetch snippets");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/snippets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      toast({
        title: "Success",
        description: "Snippet deleted successfully",
      });
      if (selectedSnippet?.id === snippetToDelete) {
        setSelectedSnippet(null);
      }
      setDeleteDialogOpen(false);
      setSnippetToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete snippet",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    setSnippetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (snippetToDelete) {
      deleteMutation.mutate(snippetToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">Loading snippets...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left side - Snippets list */}
      <div className="w-1/3 h-full overflow-y-auto border-r p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Code Snippets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {snippets.length} snippet{snippets.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Button onClick={() => setLocation("/workspace")}>
            <Code2 className="h-4 w-4 mr-2" />
            New Snippet
          </Button>
        </div>

        {snippets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No snippets yet</p>
                <p className="text-sm">
                  Go to Workspace to create your first code snippet
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {snippets.map((snippet) => (
              <Card
                key={snippet.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedSnippet?.id === snippet.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedSnippet(snippet)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{snippet.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{snippet.language}</Badge>
                        <span className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {new Date(snippet.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(snippet.id);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                {snippet.notes && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {snippet.notes}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Code viewer */}
      <div className="flex-1 h-full flex flex-col">
        {selectedSnippet ? (
          <>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div>
                <h2 className="font-semibold">{selectedSnippet.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Language: {selectedSnippet.language}
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-4">
              <CodeEditor
                value={selectedSnippet.code}
                language={selectedSnippet.language}
                height="100%"
                readOnly
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Code2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Select a snippet to view its code</p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this snippet? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
