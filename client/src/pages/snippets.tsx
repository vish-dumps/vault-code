import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const [selectedSnippetId, setSelectedSnippetId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<number | null>(null);

  const { data: snippets = [], isLoading } = useQuery<Snippet[]>({
    queryKey: ["/api/snippets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/snippets");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const toTimestamp = (value: string) => {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const sortedSnippets = [...snippets].sort(
    (a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
  );

  const filteredSnippets = sortedSnippets.filter((snippet) =>
    snippet.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  useEffect(() => {
    if (filteredSnippets.length === 0) {
      if (selectedSnippetId !== null) {
        setSelectedSnippetId(null);
      }
      return;
    }

    if (
      selectedSnippetId === null ||
      !filteredSnippets.some((snippet) => snippet.id === selectedSnippetId)
    ) {
      setSelectedSnippetId(filteredSnippets[0].id);
    }
  }, [filteredSnippets, selectedSnippetId]);

  const activeSnippet =
    filteredSnippets.find((snippet) => snippet.id === selectedSnippetId) ??
    filteredSnippets[0] ??
    null;

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
      if (selectedSnippetId !== null && selectedSnippetId === snippetToDelete) {
        setSelectedSnippetId(null);
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
              Showing {filteredSnippets.length} of {snippets.length} snippet
              {snippets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setLocation("/workspace")}>
            <Code2 className="h-4 w-4 mr-2" />
            New Snippet
          </Button>
        </div>

        {snippets.length > 0 && (
          <Input
            placeholder="Search snippets by name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full"
          />
        )}

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
        ) : filteredSnippets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No snippets match "{searchTerm}"</p>
                <p className="text-sm">Try a different search term.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSnippets.map((snippet) => (
              <Card
                key={snippet.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedSnippetId === snippet.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedSnippetId(snippet.id)}
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
        {activeSnippet ? (
          <>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div>
                <h2 className="font-semibold">{activeSnippet.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Language: {activeSnippet.language}
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-4">
              <CodeEditor
                value={activeSnippet.code}
                language={activeSnippet.language}
                height="100%"
                readOnly
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Code2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>
                {filteredSnippets.length === 0
                  ? "Adjust your search to find snippets."
                  : "Select a snippet to view its code"}
              </p>
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
