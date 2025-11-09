import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MeetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (meetLink: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

function normalizeMeetLink(link: string): string | null {
  if (!link) return null;
  try {
    const trimmed = link.trim();
    if (!trimmed) return null;
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) {
      return null;
    }
    const host = url.hostname.toLowerCase();
    if (host.includes("meet.google.com")) {
      url.hash = "";
      return url.toString();
    }
    if (host.endsWith("google.com") && url.pathname.toLowerCase().includes("/meet/")) {
      url.hash = "";
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function MeetModal({ open, onOpenChange, onCreate, isSubmitting: externalSubmitting }: MeetModalProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const normalizedValue = useMemo(() => normalizeMeetLink(value), [value]);
  const hasError = touched && !normalizedValue;

  const createRoomMutation = useMutation({
    mutationFn: async (meetLink: string) => {
      console.log("[MeetModal] Creating room with link:", meetLink);
      const response = await apiRequest("POST", "/api/rooms", { meetLink });
      console.log("[MeetModal] Response status:", response.status);
      
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error("[MeetModal] Error response:", body);
        throw new Error(body?.error || "Failed to create room");
      }
      
      const data = await response.json();
      console.log("[MeetModal] Room created successfully:", data);
      return data as { roomId: string; meetLink: string; roomUrl: string };
    },
    onSuccess: (data) => {
      console.log("[MeetModal] onSuccess called with:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      handleOpenChange(false);
      toast({
        title: "Room ready! 🎉",
        description: "Share the invite link and start collaborating.",
      });
      navigate(`/room/${data.roomId}?meet=${encodeURIComponent(data.meetLink)}`);
    },
    onError: (error: unknown) => {
      console.error("[MeetModal] onError called:", error);
      const message = error instanceof Error ? error.message : "Failed to create room";
      toast({
        title: "Unable to create room",
        description: message,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = externalSubmitting || createRoomMutation.isPending;

  const handleOpenGoogleMeet = () => {
    window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!normalizedValue) {
      return;
    }
    
    if (onCreate) {
      await onCreate(normalizedValue);
    } else {
      await createRoomMutation.mutateAsync(normalizedValue);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValue("");
      setTouched(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Meet Room</DialogTitle>
          <DialogDescription>
            Paste a Google Meet link to spin up a shared CodeVault collaboration space.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-foreground">Need a fresh Meet link?</p>
            <Button type="button" variant="outline" size="sm" onClick={handleOpenGoogleMeet}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Google Meet
            </Button>
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Choose “New meeting” &rarr; “Create a meeting for later”.</li>
            <li>Copy the generated share link from the prompt.</li>
            <li>Paste the link below so everyone in CodeVault can sync up.</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="meet-link" className="text-sm font-medium">
              Google Meet link
            </label>
            <Input
              id="meet-link"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
            {hasError && (
              <p className="text-xs text-destructive">
                Enter a valid Google Meet link.
              </p>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!normalizedValue || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
