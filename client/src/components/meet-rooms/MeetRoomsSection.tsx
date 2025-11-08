import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Video, ExternalLink, Copy, Loader2, Rocket, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MeetModal } from "./MeetModal";

interface RoomSummary {
  roomId: string;
  meetLink: string;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
  questionLink?: string | null;
  endedAt?: string | null;
}

async function fetchRooms(): Promise<RoomSummary[]> {
  const response = await apiRequest("GET", "/api/rooms");
  if (!response.ok) {
    throw new Error("Unable to load meet rooms");
  }
  return response.json();
}

export function MeetRoomsSection() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: rooms = [], isLoading } = useQuery<RoomSummary[]>({
    queryKey: ["/api/rooms"],
    queryFn: fetchRooms,
  });

  const createRoomMutation = useMutation({
    mutationFn: async (meetLink: string) => {
      const response = await apiRequest("POST", "/api/rooms", { meetLink });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to create room");
      }
      return response.json() as Promise<{ roomId: string; meetLink: string; roomUrl: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setIsModalOpen(false);
      toast({
        title: "Room ready",
        description: "Share the invite link and start collaborating.",
      });
      navigate(`/room/${data.roomId}?meet=${encodeURIComponent(data.meetLink)}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create room";
      toast({
        title: "Unable to create room",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleCopyInvite = async (room: RoomSummary) => {
    const invite = `Join my CodeVault room: ${window.location.origin}/room/${room.roomId}?meet=${encodeURIComponent(
      room.meetLink
    )}`;
    try {
      await navigator.clipboard.writeText(invite);
      toast({ title: "Invite copied", description: "Send it to your friends and start collaborating." });
    } catch {
      toast({
        title: "Could not copy invite",
        description: "Copy the link manually from the room view.",
        variant: "destructive",
      });
    }
  };

  const handleOpenMeet = (meetLink: string) => {
    window.open(meetLink, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Card className="border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Live Meet Rooms
            </CardTitle>
            <CardDescription>
              Launch a Google Meet, sketch on Excalidraw, and code together in real time.
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Rocket className="mr-2 h-4 w-4" />
            Create Meet
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
              No rooms yet. Kick off a session with the Create Meet button.
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const lastUpdated = room.updatedAt ?? room.createdAt;
                const relativeTime = formatDistanceToNow(new Date(lastUpdated), { addSuffix: true });
                const ended = Boolean(room.endedAt);
                return (
                  <div
                    key={room.roomId}
                    className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/60 hover:bg-primary/5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        Room #{room.roomId}
                        <Badge variant={ended ? "destructive" : "outline"}>
                          {ended ? "Ended" : `Updated ${relativeTime}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {room.createdByName ? `Host: ${room.createdByName}` : "Shared workspace"}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">{room.meetLink}</p>
                      {room.questionLink && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground break-all">
                          <Link2 className="h-3 w-3" />
                          <a
                            href={room.questionLink}
                            target="_blank"
                            rel="noreferrer"
                            className="underline-offset-2 hover:underline"
                          >
                            {room.questionLink}
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenMeet(room.meetLink)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Join Meet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyInvite(room)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Invite
                      </Button>
                      {room.questionLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(room.questionLink!, "_blank", "noopener,noreferrer")}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Question
                        </Button>
                      )}
                      <Separator orientation="vertical" className="hidden h-6 md:flex" />
                      <Button
                        size="sm"
                        onClick={() => navigate(`/room/${room.roomId}`)}
                      >
                        {ended ? "View room" : "Open Room"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MeetModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreate={async (meetLink) => {
          await createRoomMutation.mutateAsync(meetLink);
        }}
        isSubmitting={createRoomMutation.isPending}
      />
    </>
  );
}
