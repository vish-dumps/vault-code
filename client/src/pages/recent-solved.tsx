import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { QuestionWithDetails } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatRelativeTime(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function RecentSolved() {
  const {
    data: solvedQuestions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<QuestionWithDetails[]>({
    queryKey: ["/api/user/solved?limit=100"],
  });

  const groupedByDate = useMemo(() => {
    const result = new Map<string, QuestionWithDetails[]>();

    for (const question of solvedQuestions) {
      const solvedAt = question.solvedAt ? new Date(question.solvedAt) : new Date(question.dateSaved);
      const key = solvedAt.toISOString().slice(0, 10);
      if (!result.has(key)) {
        result.set(key, []);
      }
      result.get(key)!.push(question);
    }

    return Array.from(result.entries())
      .sort((a, b) => (a[0] > b[0] ? -1 : 1))
      .map(([dateKey, questions]) => ({
        dateKey,
        label: new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(new Date(dateKey)),
        questions: questions.sort((a, b) => {
          const aTime = new Date(a.solvedAt ?? a.dateSaved).getTime();
          const bTime = new Date(b.solvedAt ?? b.dateSaved).getTime();
          return bTime - aTime;
        }),
      }));
  }, [solvedQuestions]);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recently Solved</h1>
          <p className="text-muted-foreground mt-1">
            Automatically tracked Accepted & OK submissions from LeetCode and Codeforces.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button asChild>
            <Link href="/questions">View Question Vault</Link>
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              Unable to load solved problems right now. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading solved problems...
          </CardContent>
        </Card>
      ) : solvedQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-lg font-semibold">No auto-tracked solves yet</p>
            <p className="text-sm text-muted-foreground">
              Solve a problem on a supported platform with auto tracking enabled to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(({ dateKey, label, questions }) => (
            <Card key={dateKey}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">{label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions.map((question) => {
                  const solvedAtDisplay = formatRelativeTime(question.solvedAt ?? question.dateSaved);
                  const xpAwarded = question.xpAwarded ?? 0;
                  return (
                    <div
                      key={question.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {question.link ? (
                              <a
                                href={question.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {question.title}
                              </a>
                            ) : (
                              question.title
                            )}
                          </h3>
                          <Badge variant="secondary">{question.platform}</Badge>
                          <Badge>{question.difficulty}</Badge>
                          {xpAwarded > 0 && (
                            <Badge variant="outline">+{xpAwarded} XP</Badge>
                          )}
                        </div>
                        {question.tags?.length ? (
                          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                            {question.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {solvedAtDisplay || "Solved recently"}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
