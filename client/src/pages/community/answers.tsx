import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import {
  Badge,
} from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Star,
  Bookmark,
  BookmarkCheck,
  ArrowBigUp,
  ArrowBigUpDash,
  Plus,
  Filter,
  RefreshCcw,
} from "lucide-react";

type AnswerSummary = {
  id: string;
  questionTitle: string;
  platform: string;
  language: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  visibility: "public" | "friends";
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    handle?: string;
    displayName?: string | null;
    avatar?: {
      type?: string;
      gender?: string;
      customUrl?: string | null;
      seed?: number | null;
    };
  } | null;
  stats: {
    upvotes: number;
    bookmarks: number;
    comments: number;
    ratings: {
      clarity: number;
      correctness: number;
      efficiency: number;
      count: number;
    };
  };
  userState: {
    hasUpvoted: boolean;
    hasBookmarked: boolean;
    canEdit: boolean;
    isFriendAuthor: boolean;
  };
};

type AnswerListResponse = {
  page: number;
  limit: number;
  total: number;
  items: AnswerSummary[];
};

type AnswerDetail = AnswerSummary & {
  problemLink?: string | null;
  code: string;
  comments?: {
    id: string;
    content: string;
    createdAt: string;
    updatedAt?: string | null;
    user: {
      id: string;
      username: string;
      displayName?: string | null;
      handle?: string;
    };
    isOwner: boolean;
  }[];
  suggestions?: {
    id: string;
    content: string;
    status: string;
    createdAt: string;
    reviewedAt?: string | null;
    reviewerId?: string | null;
    user: {
      id: string;
      username: string;
      displayName?: string | null;
      handle?: string;
    };
  }[];
};

type Filters = {
  scope: "all" | "friends" | "mine" | "bookmarked";
  difficulty: "all" | "Easy" | "Medium" | "Hard";
  language: string;
  sort: "recent" | "upvoted" | "clarity" | "correctness" | "efficiency";
};

const defaultFilters: Filters = {
  scope: "all",
  difficulty: "all",
  language: "all",
  sort: "recent",
};

function useAnswers(filters: Filters, search: string) {
  const params = useMemo(() => {
    const query = new URLSearchParams();
    if (filters.scope !== "all") query.set("scope", filters.scope);
    if (filters.sort !== "recent") query.set("sort", filters.sort);
    if (filters.difficulty !== "all") query.set("difficulty", filters.difficulty);
    if (filters.language !== "all") query.set("language", filters.language);
    const trimmed = search.trim();
    if (trimmed) query.set("q", trimmed);
    return query.toString();
  }, [filters, search]);

  return useQuery<AnswerListResponse>({
    queryKey: ["/api/answers", params],
    queryFn: async () => {
      const url = params ? `/api/answers?${params}` : "/api/answers";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });
}

function useAnswerDetail(answerId: string | null) {
  return useQuery<AnswerDetail>({
    queryKey: ["/api/answers", answerId ?? "detail"],
    enabled: Boolean(answerId),
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/answers/${answerId}`);
      return res.json();
    },
  });
}

export default function CommunityAnswers() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const { user } = useAuth();

  const answersQuery = useAnswers(filters, search);
  const detailQuery = useAnswerDetail(selectedAnswerId);

  const upvoteMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const res = await apiRequest("POST", `/api/answers/${answerId}/upvote`);
      return res.json();
    },
    onSuccess: (_data, answerId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/answers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/answers", answerId] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const res = await apiRequest("POST", `/api/answers/${answerId}/bookmark`);
      return res.json();
    },
    onSuccess: (_data, answerId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/answers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/answers", answerId] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/answers", payload);
      return res.json();
    },
    onSuccess: () => {
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/answers"] });
    },
  });

  const createAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      questionTitle: formData.get("questionTitle"),
      platform: formData.get("platform"),
      problemLink: formData.get("problemLink") || undefined,
      language: formData.get("language"),
      difficulty: formData.get("difficulty"),
      code: formData.get("code"),
      explanation: formData.get("explanation"),
      visibility: formData.get("visibility"),
      tags: (formData.get("tags") as string)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    createMutation.mutate(payload);
  };

  const answers = answersQuery.data?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community Answer Bank</h1>
          <p className="text-muted-foreground">
            Discover, share, and collaborate on solutions from the CodeVault community.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => answersQuery.refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Share Answer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Share a new answer</DialogTitle>
              </DialogHeader>
              <form onSubmit={createAnswer} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="questionTitle">Question Title</Label>
                    <Input id="questionTitle" name="questionTitle" required placeholder="Two Sum" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Input id="platform" name="platform" required placeholder="LeetCode" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input id="language" name="language" required placeholder="TypeScript" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select name="difficulty" defaultValue="Medium">
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="problemLink">Problem Link</Label>
                    <Input id="problemLink" name="problemLink" placeholder="https://leetcode.com/problems/two-sum" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" name="tags" placeholder="array, hash-table" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select name="visibility" defaultValue="public">
                      <SelectTrigger id="visibility">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Textarea
                    id="code"
                    name="code"
                    required
                    className="min-h-[160px] font-mono text-sm"
                    placeholder="Paste your solution..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="explanation">Explanation</Label>
                  <Textarea
                    id="explanation"
                    name="explanation"
                    required
                    className="min-h-[120px]"
                    placeholder="Explain how your solution works..."
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Sharing..." : "Share Answer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, tags, or explanation..."
              className="lg:max-w-sm"
            />
            <Tabs
              defaultValue="all"
              value={filters.scope}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, scope: value as Filters["scope"] }))
              }
              className="w-full lg:w-auto"
            >
              <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="friends">Friends</TabsTrigger>
                <TabsTrigger value="mine">My Answers</TabsTrigger>
                <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <Select
                value={filters.difficulty}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, difficulty: value as Filters["difficulty"] }))
                }
              >
                <SelectTrigger className="md:w-[160px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Language"
                value={filters.language === "all" ? "" : filters.language}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    language: event.target.value.trim() ? event.target.value : "all",
                  }))
                }
                className="md:w-[160px]"
              />
              <Select
                value={filters.sort}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sort: value as Filters["sort"] }))
                }
              >
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="upvoted">Most Upvoted</SelectItem>
                  <SelectItem value="clarity">Clarity Rating</SelectItem>
                  <SelectItem value="correctness">Correctness Rating</SelectItem>
                  <SelectItem value="efficiency">Efficiency Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {answersQuery.isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="animate-pulse border-dashed">
              <CardHeader>
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted/60" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 w-full rounded bg-muted/80" />
                <div className="h-3 w-4/5 rounded bg-muted/60" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded bg-muted/70" />
                  <div className="h-6 w-16 rounded bg-muted/70" />
                </div>
              </CardContent>
            </Card>
          ))}

        {!answersQuery.isLoading && answers.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-12 text-center text-muted-foreground">
              No answers found for the selected filters.
            </CardContent>
          </Card>
        )}

        {answers.map((answer) => (
          <Card key={answer.id} className="flex flex-col">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{answer.questionTitle}</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {answer.platform} • {answer.language}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={answer.userState.hasUpvoted ? "default" : "outline"}
                    onClick={() => upvoteMutation.mutate(answer.id)}
                    disabled={upvoteMutation.isPending}
                  >
                    {answer.userState.hasUpvoted ? (
                      <ArrowBigUp className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowBigUpDash className="mr-1 h-4 w-4" />
                    )}
                    {answer.stats.upvotes}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bookmarkMutation.mutate(answer.id)}
                    disabled={bookmarkMutation.isPending}
                  >
                    {answer.userState.hasBookmarked ? (
                      <BookmarkCheck className="mr-1 h-4 w-4" />
                    ) : (
                      <Bookmark className="mr-1 h-4 w-4" />
                    )}
                    {answer.stats.bookmarks}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="uppercase">
                  {answer.difficulty}
                </Badge>
                {answer.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
                {answer.tags.length > 3 && (
                  <Badge variant="secondary">+{answer.tags.length - 3}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-4">
              <div className="line-clamp-4 text-sm text-muted-foreground">
                {answer.explanation}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {answer.stats.comments} comments
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAnswerId(answer.id)}>
                  View details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnswerDetailDialog
        answerId={selectedAnswerId}
        onClose={() => setSelectedAnswerId(null)}
        query={detailQuery}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}

function AnswerDetailDialog(props: {
  answerId: string | null;
  onClose: () => void;
  query: ReturnType<typeof useAnswerDetail>;
  currentUserId: string;
}) {
  const { answerId, onClose, query, currentUserId } = props;
  const [comment, setComment] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [ratings, setRatings] = useState({ clarity: 5, correctness: 5, efficiency: 5 });

  useEffect(() => {
    setComment("");
    setSuggestion("");
    setRatings({ clarity: 5, correctness: 5, efficiency: 5 });
  }, [answerId]);

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!answerId) return;
      const res = await apiRequest("POST", `/api/answers/${answerId}/comments`, { content: comment });
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      if (answerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/answers", answerId] });
        queryClient.invalidateQueries({ queryKey: ["/api/answers"] });
      }
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async () => {
      if (!answerId) return;
      const res = await apiRequest("POST", `/api/answers/${answerId}/rate`, ratings);
      return res.json();
    },
    onSuccess: () => {
      if (answerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/answers", answerId] });
        queryClient.invalidateQueries({ queryKey: ["/api/answers"] });
      }
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      if (!answerId) return;
      const res = await apiRequest("POST", `/api/answers/${answerId}/suggestions`, { content: suggestion });
      return res.json();
    },
    onSuccess: () => {
      setSuggestion("");
      if (answerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/answers", answerId] });
      }
    },
  });

  const answer = query.data;
  const open = Boolean(answerId);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
        {query.isLoading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            Loading answer...
          </div>
        )}
        {answer && (
          <div className="flex h-[70vh] flex-col">
            <DialogHeader className="space-y-2">
              <DialogTitle>{answer.questionTitle}</DialogTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{answer.platform}</Badge>
                <Badge variant="outline">{answer.language}</Badge>
                <Badge variant={answer.visibility === "public" ? "default" : "secondary"}>
                  {answer.visibility === "public" ? "Public" : "Friends"}
                </Badge>
                <span>
                  Posted {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                </span>
              </div>
            </DialogHeader>
            <Separator className="my-4" />
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {answer.problemLink && (
                  <Button variant="ghost" className="px-0" asChild>
                    <a href={answer.problemLink} target="_blank" rel="noopener noreferrer">
                      View problem statement
                    </a>
                  </Button>
                )}
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold">Explanation</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{answer.explanation}</p>
                </section>
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold">Code</h3>
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono">
                    {answer.code}
                  </pre>
                </section>
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold">Ratings</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      <Star className="mr-1 inline h-4 w-4 text-yellow-500" />
                      Clarity: {answer.stats.ratings.clarity.toFixed(2)}
                    </span>
                    <span>
                      <Star className="mr-1 inline h-4 w-4 text-yellow-500" />
                      Correctness: {answer.stats.ratings.correctness.toFixed(2)}
                    </span>
                    <span>
                      <Star className="mr-1 inline h-4 w-4 text-yellow-500" />
                      Efficiency: {answer.stats.ratings.efficiency.toFixed(2)}
                    </span>
                    <span>{answer.stats.ratings.count} ratings</span>
                  </div>
                  <form
                    className="grid gap-3 sm:grid-cols-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      ratingMutation.mutate();
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="clarity">Clarity</Label>
                      <Input
                        id="clarity"
                        type="number"
                        min={1}
                        max={5}
                        value={ratings.clarity}
                        onChange={(event) =>
                          setRatings((prev) => ({ ...prev, clarity: Number(event.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correctness">Correctness</Label>
                      <Input
                        id="correctness"
                        type="number"
                        min={1}
                        max={5}
                        value={ratings.correctness}
                        onChange={(event) =>
                          setRatings((prev) => ({ ...prev, correctness: Number(event.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="efficiency">Efficiency</Label>
                      <Input
                        id="efficiency"
                        type="number"
                        min={1}
                        max={5}
                        value={ratings.efficiency}
                        onChange={(event) =>
                          setRatings((prev) => ({ ...prev, efficiency: Number(event.target.value) }))
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={ratingMutation.isPending}>
                        {ratingMutation.isPending ? "Submitting..." : "Submit rating"}
                      </Button>
                    </div>
                  </form>
                </section>
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold">Comments</h3>
                  <div className="space-y-3">
                    {answer.comments?.length ? (
                      answer.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{comment.user.displayName ?? comment.user.username}</span>
                            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No comments yet.</p>
                    )}
                  </div>
                  <form
                    className="space-y-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (comment.trim()) {
                        commentMutation.mutate();
                      }
                    }}
                  >
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                    />
                    <Button type="submit" disabled={commentMutation.isPending || !comment.trim()}>
                      {commentMutation.isPending ? "Posting..." : "Post comment"}
                    </Button>
                  </form>
                </section>
                {answer.author?.id !== currentUserId && (
                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold">Suggest an edit</h3>
                    <Textarea
                      placeholder="Propose improvements to this answer..."
                      value={suggestion}
                      onChange={(event) => setSuggestion(event.target.value)}
                    />
                    <Button
                      onClick={() => suggestion.trim() && suggestionMutation.mutate()}
                      disabled={suggestionMutation.isPending || !suggestion.trim()}
                    >
                      {suggestionMutation.isPending ? "Submitting..." : "Submit suggestion"}
                    </Button>
                    {answer.suggestions && answer.suggestions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Suggestion history</h4>
                        {answer.suggestions.map((item) => (
                          <div key={item.id} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.user.displayName ?? item.user.username}</span>
                              <span>{item.status}</span>
                            </div>
                            <p className="mt-2 text-foreground">{item.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



