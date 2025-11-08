import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FriendSummary = {
  id: string;
  username: string;
  displayName?: string | null;
  handle?: string | null;
  badge?: string | null;
};

type FriendListResponse = {
  total: number;
  friends: FriendSummary[];
};

interface InviteFriendsDialogProps {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFriendsDialog({ roomId, open, onOpenChange }: InviteFriendsDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery<FriendListResponse>({
    queryKey: ["/api/users/me/friends", "invite", roomId],
    enabled: open,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/me/friends?limit=100`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to load friends");
      }
      return response.json();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (friendIds: string[]) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/invite`, { friendIds });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to send invites");
      }
      return response.json() as Promise<{ invited: number; skipped?: number }>;
    },
    onSuccess: (result) => {
      toast({
        title: result.invited > 0 ? "Invites sent" : "No invites sent",
        description:
          result.invited > 0
            ? `We notified ${result.invited} friend${result.invited === 1 ? "" : "s"}.`
            : "Pick at least one friend to send an invite.",
      });
      if (result.invited > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        setSelectedIds([]);
        onOpenChange(false);
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to send invites";
      toast({ title: "Invite failed", description: message, variant: "destructive" });
    },
  });

  const friends = data?.friends ?? [];

  const filteredFriends = useMemo(() => {
    if (!searchTerm.trim()) {
      return friends;
    }
    const term = searchTerm.trim().toLowerCase();
    return friends.filter((friend) => {
      const display = friend.displayName ?? friend.username;
      return (
        display?.toLowerCase().includes(term) ||
        friend.username.toLowerCase().includes(term) ||
        friend.handle?.toLowerCase().includes(term)
      );
    });
  }, [friends, searchTerm]);

  const handleToggle = (friendId: string) => {
    setSelectedIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedIds.length || inviteMutation.isPending) {
      if (!selectedIds.length) {
        toast({ title: "Pick someone", description: "Select at least one friend to invite." });
      }
      return;
    }
    inviteMutation.mutate(selectedIds);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedIds([]);
      setSearchTerm("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite friends</DialogTitle>
          <DialogDescription>
            Send a notification so your friends can jump into this live room instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="sm:w-64"
            />
            <Badge variant="outline">
              {selectedIds.length} selected
            </Badge>
          </div>

          <div className="rounded-md border border-border/60">
            <ScrollArea className="h-64">
              <div className="divide-y divide-border/70">
                {isLoading ? (
                  <div className="p-6 text-sm text-muted-foreground">Loading friends…</div>
                ) : filteredFriends.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    {friends.length === 0
                      ? "You have no friends yet. Connect from the community tab."
                      : "No friends match that search."}
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    const displayName = friend.displayName ?? friend.username;
                    return (
                      <label
                        key={friend.id}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedIds.includes(friend.id)}
                          onCheckedChange={() => handleToggle(friend.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            @{friend.username}
                            {friend.badge ? ` • ${friend.badge}` : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedIds.length || inviteMutation.isPending}>
              {inviteMutation.isPending
                ? "Sending..."
                : selectedIds.length
                ? `Send ${selectedIds.length} invite${selectedIds.length === 1 ? "" : "s"}`
                : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
