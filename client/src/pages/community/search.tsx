import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Search, ArrowRight } from "lucide-react";
import { Link } from "wouter";

type SearchResult = {
  id: string;
  username: string;
  displayName?: string | null;
  handle?: string;
  xp?: number;
  badge?: string;
  bio?: string | null;
  college?: string | null;
  isFriend?: boolean;
  isSelf?: boolean;
};

export default function CommunitySearch() {
  const [query, setQuery] = useState("");

  const searchResults = useQuery<SearchResult[]>({
    queryKey: ["/api/users/search", query],
    enabled: query.trim().length > 1,
    queryFn: async () => {
      const params = new URLSearchParams({ q: query.trim() });
      const res = await apiRequest("GET", `/api/users/search?${params.toString()}`);
      return res.json();
    },
  });

  const results = searchResults.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Find Coders</h1>
        <p className="text-muted-foreground">
          Search CodeVault users by handle, username, or display name to explore their profiles.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Search className="h-4 w-4" />
            Search by username or handle
          </CardTitle>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="@handle or username"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {query.length <= 1 && (
            <div className="text-sm text-muted-foreground">Type at least two characters to search.</div>
          )}
          {query.length > 1 && searchResults.isLoading && (
            <div className="text-sm text-muted-foreground">Searching...</div>
          )}
          {query.length > 1 && !searchResults.isLoading && results.length === 0 && (
            <div className="text-sm text-muted-foreground">No users match that query.</div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {results.map((result) => (
              <div key={result.id} className="flex items-start justify-between rounded border p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-foreground">
                    {result.displayName ?? result.username}
                  </span>
                  <span className="text-sm text-muted-foreground">{result.handle}</span>
                  {result.college && (
                    <span className="text-xs text-muted-foreground">{result.college}</span>
                  )}
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {result.badge && <Badge variant="outline">{result.badge}</Badge>}
                    <Badge variant="secondary">{result.xp ?? 0} XP</Badge>
                  </div>
                  {result.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{result.bio}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {result.isFriend && <Badge variant="secondary">Friend</Badge>}
                  {result.isSelf ? (
                    <Badge variant="outline">This is you</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/u/${result.handle ?? result.username}`}>
                        View profile
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

