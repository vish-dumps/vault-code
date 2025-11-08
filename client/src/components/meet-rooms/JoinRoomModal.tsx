import { useMemo, useState } from "react";
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

interface JoinRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ParsedRoomTarget = {
  roomId: string;
  meetLink?: string;
};

const ROOM_CODE_PATTERN = /^[a-zA-Z0-9_-]{4,}$/;

function extractRoomTarget(rawValue: string): ParsedRoomTarget | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const linkMatch = trimmed.match(/https?:\/\/\S+/);
  const candidate = linkMatch ? linkMatch[0] : trimmed;

  const parseUrl = (input: string): ParsedRoomTarget | null => {
    try {
      const url = new URL(input);
      const segments = url.pathname.split("/").filter(Boolean);
      if (!segments.length) {
        return null;
      }

      const roomSegmentIndex = segments.findIndex((segment) => segment === "room");
      const roomId =
        roomSegmentIndex >= 0 && segments.length > roomSegmentIndex + 1
          ? segments[roomSegmentIndex + 1]
          : segments[segments.length - 1];

      if (!roomId || !ROOM_CODE_PATTERN.test(roomId)) {
        return null;
      }

      const meetLink = url.searchParams.get("meet") ?? undefined;
      return { roomId, meetLink };
    } catch {
      return null;
    }
  };

  const urlResult = parseUrl(candidate);
  if (urlResult) {
    return urlResult;
  }

  // handle "Join my CodeVault room: https://..." style strings
  const urlInSentenceMatch = trimmed.match(/https?:\/\/[^\s]+/);
  if (urlInSentenceMatch?.[0] && urlInSentenceMatch[0] !== candidate) {
    const fallbackUrl = parseUrl(urlInSentenceMatch[0]);
    if (fallbackUrl) {
      return fallbackUrl;
    }
  }

  if (trimmed.includes("?meet=")) {
    const [roomCandidate, meetPart] = trimmed.split("?meet=");
    const roomId = roomCandidate.split("/").filter(Boolean).pop();
    if (roomId && ROOM_CODE_PATTERN.test(roomId)) {
      return { roomId, meetLink: decodeURIComponent(meetPart) };
    }
  }

  if (trimmed.includes("/room/")) {
    const roomId = trimmed.split("/room/").pop()?.split(/[/?#]/)[0];
    if (roomId && ROOM_CODE_PATTERN.test(roomId)) {
      return { roomId };
    }
  }

  if (ROOM_CODE_PATTERN.test(trimmed)) {
    return { roomId: trimmed };
  }

  return null;
}

export function JoinRoomModal({ open, onOpenChange }: JoinRoomModalProps) {
  const [, navigate] = useLocation();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const parsedTarget = useMemo(() => extractRoomTarget(value), [value]);
  const hasError = touched && !parsedTarget;

  const resetState = () => {
    setValue("");
    setTouched(false);
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!parsedTarget || submitting) {
      return;
    }

    setSubmitting(true);
    const searchParams = parsedTarget.meetLink
      ? `?meet=${encodeURIComponent(parsedTarget.meetLink)}`
      : "";
    navigate(`/room/${parsedTarget.roomId}${searchParams}`);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Join a Live Room</DialogTitle>
          <DialogDescription>
            Paste a CodeVault room link, invite message, or enter the room code shared by a friend.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="room-target" className="text-sm font-medium">
              Room link or code
            </label>
            <Input
              id="room-target"
              placeholder="https://codevault.app/room/abC123?meet=..."
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
            {hasError && (
              <p className="text-xs text-destructive">
                Enter a valid CodeVault room URL or the room code from the invite.
              </p>
            )}
          </div>

          <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Quick tips:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Paste the full invite message — we&apos;ll grab the link automatically.</li>
              <li>Room codes are alphanumeric (e.g. <code>room-7x2q</code> or <code>7x2q</code>).</li>
              <li>Keep the Meet link in the URL so everyone can hop into the call instantly.</li>
            </ul>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!parsedTarget || submitting}>
              {submitting ? "Joining..." : "Join room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
