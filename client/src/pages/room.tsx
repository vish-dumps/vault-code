import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { Socket } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronLeft,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  Power,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InviteFriendsDialog } from "@/components/meet-rooms/InviteFriendsDialog";
import { QuestionLinkDialog } from "@/components/meet-rooms/QuestionLinkDialog";
import { getSocket } from "@/utils/socket";

interface MeetRoomPageProps {
  params: {
    id: string;
  };
}

type SceneData = {
  appState?: Record<string, unknown> | null;
  [key: string]: unknown;
};

interface MeetRoomData {
  roomId: string;
  meetLink: string;
  createdBy: string | null;
  createdByName?: string;
  canvasData?: SceneData | null;
  codeData?: string | null;
  questionLink?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface CanvasUpdateMessage {
  roomId: string;
  scene: SceneData;
}

interface CodeUpdateMessage {
  roomId: string;
  code: string;
  language?: string;
}

interface RoomMember {
  socketId: string;
  userId: string;
  username?: string | null;
}

const CURSOR_COLORS = [
  { background: "#f97316", stroke: "#c2410c" },
  { background: "#22c55e", stroke: "#15803d" },
  { background: "#3b82f6", stroke: "#1d4ed8" },
  { background: "#a855f7", stroke: "#7c3aed" },
  { background: "#ec4899", stroke: "#be185d" },
  { background: "#f59e0b", stroke: "#b45309" },
  { background: "#14b8a6", stroke: "#0f766e" },
  { background: "#f973ab", stroke: "#db2777" },
];

function getCursorColors(userId: string) {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[colorIndex];
}

type ExcalidrawAPIHandle = {
  updateScene: (scene: any) => void;
};

const prepareSceneForTransport = (scene: SceneData | null | undefined): SceneData | null => {
  if (!scene || typeof scene !== "object") {
    return null;
  }

  const sanitizedScene: SceneData = { ...scene };
  const appState = (scene.appState ?? undefined) as Record<string, unknown> | null | undefined;
  if (appState && typeof appState === "object") {
    const { collaborators: _ignored, ...restAppState } = appState;
    sanitizedScene.appState = { ...restAppState };
  }

  return sanitizedScene;
};

const rehydrateScene = (scene: SceneData | null | undefined): SceneData | null => {
  if (!scene || typeof scene !== "object") {
    return null;
  }

  const hydratedScene: SceneData = { ...scene };
  const appState = (scene.appState ?? undefined) as Record<string, unknown> | null | undefined;
  if (appState && typeof appState === "object") {
    const nextAppState = {
      ...appState,
      collaborators: new Map<string, unknown>(),
    };
    hydratedScene.appState = nextAppState;
  }

  return hydratedScene;
};

export default function MeetRoomWorkspace({ params }: MeetRoomPageProps) {
  const roomId = params.id;
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [codeValue, setCodeValue] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [connectionState, setConnectionState] = useState<"connecting" | "online" | "offline">("connecting");
  const [questionLink, setQuestionLink] = useState<string | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);

  const endRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/end`, {});
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to end room");
      }
      return response.json();
    },
    onSuccess: () => {
      setRoomEnded(true);
      setIsEndDialogOpen(false);
      toast({
        title: "Room ended",
        description: "This live room has been closed for everyone.",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to end room";
      toast({ title: "Unable to end room", description: message, variant: "destructive" });
    },
  });

  const excalidrawAPIRef = useRef<ExcalidrawAPIHandle | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const canvasDebounceRef = useRef<number | null>(null);
  const pendingSceneRef = useRef<CanvasUpdateMessage | null>(null);
  const codeDebounceRef = useRef<number | null>(null);
  const collaboratorsRef = useRef<Map<string, { pointer: { x: number; y: number }; username?: string | null; color: { background: string; stroke: string } }>>(new Map());
  const pointerThrottleRef = useRef<number>(0);

  const refreshCollaborators = useCallback(() => {
    if (!excalidrawAPIRef.current) return;
    const entries = new Map<string, any>();
    collaboratorsRef.current.forEach((value, key) => {
      entries.set(key, {
        pointer: value.pointer,
        username: value.username,
        color: value.color,
      });
    });
    excalidrawAPIRef.current.updateScene({
      appState: {
        collaborators: entries,
      },
    });
  }, []);

  const roomQuery = useQuery<MeetRoomData>({
    queryKey: ["/api/rooms", roomId],
    enabled: Boolean(roomId),
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/rooms/${roomId}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Room not found");
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (roomQuery.data?.codeData !== undefined && roomQuery.data?.codeData !== null) {
      setCodeValue(roomQuery.data.codeData);
    } else {
      setCodeValue("");
    }
  }, [roomQuery.data?.codeData]);

  useEffect(() => {
    setQuestionLink(roomQuery.data?.questionLink ?? null);
    setRoomEnded(Boolean(roomQuery.data?.endedAt));
  }, [roomQuery.data?.questionLink, roomQuery.data?.endedAt]);

  const initialSceneLoaded = useRef(false);
  useEffect(() => {
    if (!initialSceneLoaded.current && excalidrawAPIRef.current) {
      const hydratedScene = rehydrateScene(roomQuery.data?.canvasData);
      if (hydratedScene) {
        excalidrawAPIRef.current.updateScene(hydratedScene);
        initialSceneLoaded.current = true;
      }
    }
  }, [roomQuery.data?.canvasData]);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setConnectionState("online");
      socket.emit("join_room", { roomId });
    };

    const handleDisconnect = () => setConnectionState("offline");

    const handleConnectError = (error: Error) => {
      setConnectionState("offline");
      toast({
        title: "Realtime connection failed",
        description: error.message || "Retrying...",
        variant: "destructive",
      });
    };

    const handleRoomState = (payload: {
      canvasData?: SceneData | null;
      codeData?: string;
      questionLink?: string | null;
      members?: RoomMember[];
    }) => {
      if (payload.codeData !== undefined && payload.codeData !== null) {
        setCodeValue(payload.codeData);
      }
      if (payload.canvasData && excalidrawAPIRef.current) {
        const hydratedScene = rehydrateScene(payload.canvasData);
        if (hydratedScene) {
          excalidrawAPIRef.current.updateScene(hydratedScene);
        }
      }
      if (payload.questionLink !== undefined) {
        setQuestionLink(payload.questionLink ?? null);
      }
      if (Array.isArray(payload.members)) {
        const unique = new Map(payload.members.map((member) => [member.socketId, member]));
        setMembers(Array.from(unique.values()));
      }
      collaboratorsRef.current.clear();
      refreshCollaborators();
      setRoomEnded(false);
    };

    const handleCanvasUpdate = (payload: { scene: SceneData | null }) => {
      if (payload.scene && excalidrawAPIRef.current) {
        const hydratedScene = rehydrateScene(payload.scene);
        if (hydratedScene) {
          excalidrawAPIRef.current.updateScene(hydratedScene);
        }
      }
    };

    const handleCodeUpdate = (payload: { code: string }) => {
      setCodeValue(payload.code ?? "");
    };

    const handleQuestionUpdate = (payload: { questionLink?: string | null }) => {
      setQuestionLink(payload.questionLink ?? null);
    };

    const handleCursorUpdate = (payload: { userId?: string; username?: string; pointer?: { x: number; y: number } | null }) => {
      const targetUserId = payload?.userId;
      if (!targetUserId || targetUserId === user?.id) {
        return;
      }
      if (payload.pointer && typeof payload.pointer.x === "number" && typeof payload.pointer.y === "number") {
        collaboratorsRef.current.set(targetUserId, {
          pointer: payload.pointer,
          username: payload.username,
          color: getCursorColors(targetUserId),
        });
      } else {
        collaboratorsRef.current.delete(targetUserId);
      }
      refreshCollaborators();
    };

    const handleRoomPresence = (payload: { type: "joined" | "left"; member?: RoomMember }) => {
      if (payload.member && payload.type === "left") {
        collaboratorsRef.current.delete(payload.member.userId);
        refreshCollaborators();
      }
      if (!payload.member) return;
      setMembers((prev) => {
        if (payload.type === "joined") {
          const map = new Map(prev.map((member) => [member.socketId, member]));
          map.set(payload.member!.socketId, payload.member!);
          return Array.from(map.values());
        }
        if (payload.type === "left") {
          return prev.filter((member) => member.socketId !== payload.member!.socketId);
        }
        return prev;
      });
    };

    const handleRoomClosed = () => {
      setRoomEnded(true);
      collaboratorsRef.current.clear();
      refreshCollaborators();
      toast({ title: "Room ended", description: "The host closed this live room." });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("room_state", handleRoomState);
    socket.on("canvas_update", handleCanvasUpdate);
    socket.on("code_update", handleCodeUpdate);
    socket.on("question_update", handleQuestionUpdate);
    socket.on("cursor_update", handleCursorUpdate);
    socket.on("room_presence", handleRoomPresence);
    socket.on("room_closed", handleRoomClosed);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("cursor_update", { roomId, userId: user?.id, pointer: null });
        socketRef.current.emit("leave_room", { roomId });
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("room_state", handleRoomState);
      socket.off("canvas_update", handleCanvasUpdate);
      socket.off("code_update", handleCodeUpdate);
      socket.off("question_update", handleQuestionUpdate);
      socket.off("cursor_update", handleCursorUpdate);
      socket.off("room_presence", handleRoomPresence);
      socket.off("room_closed", handleRoomClosed);
      socketRef.current = null;
      collaboratorsRef.current.clear();
      refreshCollaborators();
    };
  }, [roomId, token, toast, refreshCollaborators, user?.id]);

  useEffect(() => {
    return () => {
      if (canvasDebounceRef.current) {
        window.clearTimeout(canvasDebounceRef.current);
      }
      if (codeDebounceRef.current) {
        window.clearTimeout(codeDebounceRef.current);
      }
    };
  }, []);

  const handleCanvasChange = useCallback(
    (elements: any, appState: any, files: any) => {
      if (roomEnded) {
        return;
      }
      const sceneForTransport = prepareSceneForTransport({ elements, appState, files });
      if (!sceneForTransport) {
        return;
      }
      pendingSceneRef.current = { roomId, scene: sceneForTransport };

      if (canvasDebounceRef.current) {
        return;
      }

      canvasDebounceRef.current = window.setTimeout(() => {
        if (pendingSceneRef.current) {
          socketRef.current?.emit("canvas_update", pendingSceneRef.current);
        }
        canvasDebounceRef.current && window.clearTimeout(canvasDebounceRef.current);
        canvasDebounceRef.current = null;
      }, 220);
    },
    [roomEnded, roomId]
  );

  const handleCodeChange = useCallback(
    (next?: string) => {
      if (roomEnded) {
        return;
      }
      const value = next ?? "";
      setCodeValue(value);
      if (!socketRef.current) return;

      if (codeDebounceRef.current) {
        return;
      }

      const payload: CodeUpdateMessage = { roomId, code: value };
      codeDebounceRef.current = window.setTimeout(() => {
        socketRef.current?.emit("code_update", payload);
        codeDebounceRef.current && window.clearTimeout(codeDebounceRef.current);
        codeDebounceRef.current = null;
      }, 240);
    },
    [roomEnded, roomId]
  );

  const handleQuestionLinkSave = useCallback(
    async (link: string | null) => {
      if (roomEnded) {
        throw new Error("This room has ended.");
      }
      setQuestionLink(link);
      socketRef.current?.emit("question_update", { roomId, questionLink: link });
      toast({
        title: link ? "Question link shared" : "Question link cleared",
        description: link
          ? "Everyone in the room now has quick access to the problem."
          : "The question link has been removed for this session.",
      });
    },
    [roomEnded, roomId, toast]
  );


  const toggleEditor = useCallback(() => {
    setIsEditorOpen((prev) => !prev);
  }, []);

  const handlePointerUpdate = useCallback(
    ({ pointer }: { pointer?: { x: number; y: number } }) => {
      if (!socketRef.current || roomEnded || !user?.id) {
        return;
      }
      const now = Date.now();
      if (pointer) {
        if (pointerThrottleRef.current && now - pointerThrottleRef.current < 50) {
          return;
        }
        pointerThrottleRef.current = now;
      } else {
        pointerThrottleRef.current = now;
      }
      socketRef.current.emit("cursor_update", {
        roomId,
        userId: user.id,
        username: user.displayName ?? user.username,
        pointer: pointer ? { x: pointer.x, y: pointer.y } : null,
      });
    },
    [roomEnded, roomId, user]
  );

  const handleCopyInvite = useCallback(async () => {
    if (!roomQuery.data) return;
    const invite = `Join my CodeVault room: ${window.location.origin}/room/${roomQuery.data.roomId}?meet=${encodeURIComponent(
      roomQuery.data.meetLink
    )}`;
    try {
      await navigator.clipboard.writeText(invite);
      toast({ title: "Invite copied", description: "Share it with your crew." });
    } catch {
      toast({
        title: "Unable to copy",
        description: "Copy the invite manually from the address bar.",
        variant: "destructive",
      });
    }
  }, [roomQuery.data, toast]);

  const handleOpenMeet = useCallback(() => {
    if (!roomQuery.data) return;
    window.open(roomQuery.data.meetLink, "_blank", "noopener,noreferrer");
  }, [roomQuery.data]);

  const connectionBadge = useMemo(() => {
    if (roomEnded) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-destructive/60 text-destructive">
          Ended
        </Badge>
      );
    }
    if (connectionState === "connecting") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting
        </Badge>
      );
    }
    if (connectionState === "online") {
      return (
        <Badge className="flex items-center gap-1 bg-emerald-500/90 text-emerald-950 hover:bg-emerald-500">
          <Wifi className="h-3 w-3" />
          Live
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  }, [connectionState, roomEnded]);

  if (roomQuery.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Joining room...</p>
      </div>
    );
  }

  if (roomQuery.isError || !roomQuery.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
        <Card className="max-w-md border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load that room. It may have been deleted or you might not have access.
          </p>
        </Card>
        <Button onClick={() => navigate("/")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>
      </div>
    );
  }

  const room = roomQuery.data;
  const lastUpdated = room.updatedAt ?? room.createdAt;
  const relativeTime = formatDistanceToNow(new Date(lastUpdated), { addSuffix: true });
  const isHost = Boolean(user?.id && room.createdBy === user.id);
  const memberCount = members.length;
  const shortMeetLink = useMemo(() => {
    try {
      const url = new URL(room.meetLink);
      return `${url.host}${url.pathname}`;
    } catch {
      return room.meetLink;
    }
  }, [room.meetLink]);
  const shortQuestionLink = useMemo(() => {
    if (!questionLink) return null;
    try {
      const url = new URL(questionLink);
      return `${url.host}${url.pathname}`;
    } catch {
      return questionLink;
    }
  }, [questionLink]);

  return (
    <div className="flex h-full flex-col bg-neutral-950 text-slate-100">
      <header className="border-b border-white/10 bg-neutral-900/80 px-4 py-3 backdrop-blur">

        <div className="flex flex-wrap items-start justify-between gap-3">

          <div className="space-y-1">

            <div className="flex items-center gap-2 text-xs text-slate-400">

              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>

                <ChevronLeft className="mr-1 h-4 w-4" />

                Dashboard

              </Button>

              <span className="text-slate-600">/</span>

              <span className="font-mono text-slate-300">room-{room.roomId}</span>

              {connectionBadge}

            </div>

            <p className="text-sm text-slate-400">

              {room.createdByName ? `Hosted by ${room.createdByName}` : "Collaborative workspace"} - Updated {relativeTime}

            </p>

          </div>

          <div className="flex flex-wrap items-center gap-2">

            <Button variant="secondary" size="sm" onClick={handleOpenMeet}>

              <ExternalLink className="mr-2 h-4 w-4" />

              Join Meet

            </Button>

            <Button variant="outline" size="sm" onClick={handleCopyInvite}>

              <Copy className="mr-2 h-4 w-4" />

              Copy invite

            </Button>

            <Button

              variant="outline"

              size="sm"

              onClick={() => setIsInviteOpen(true)}

              disabled={roomEnded}

            >

              <UserPlus className="mr-2 h-4 w-4" />

              Invite friends

            </Button>

            <Button

              variant="outline"

              size="sm"

              onClick={() => setIsQuestionDialogOpen(true)}

              disabled={roomEnded}

            >

              <Link2 className="mr-2 h-4 w-4" />

              {questionLink ? "Edit question" : "Add question"}

            </Button>

            <Popover>

              <PopoverTrigger asChild>

                <Button variant="outline" size="sm">

                  <Users className="mr-2 h-4 w-4" />

                  {memberCount || 0} online

                </Button>

              </PopoverTrigger>

              <PopoverContent align="end" className="w-64">

                <div className="flex items-center justify-between border-b border-border/60 pb-2">

                  <p className="text-sm font-semibold text-foreground">Room members</p>

                  <Badge variant="secondary" className="text-xs">

                    {memberCount}

                  </Badge>

                </div>

                <div className="mt-2 space-y-2">

                  {memberCount ? (

                    members.map((member) => {

                      const isSelf = member.userId === user?.id;

                      const memberIsHost = member.userId && room.createdBy === member.userId;

                      return (

                        <div key={member.socketId} className="flex items-center justify-between gap-2 text-sm">

                          <span className="text-foreground">

                            {member.username ?? "Guest"}

                            {isSelf ? " (you)" : ""}

                          </span>

                          {memberIsHost ? <Badge variant="outline">Host</Badge> : null}

                        </div>

                      );

                    })

                  ) : (

                    <p className="text-sm text-muted-foreground">You&apos;re the first one here. Send an invite!</p>

                  )}

                </div>

              </PopoverContent>

            </Popover>

            <Button variant="outline" size="sm" onClick={toggleEditor}>

              {isEditorOpen ? (

                <>

                  <PanelRightClose className="mr-2 h-4 w-4" />

                  Hide code

                </>

              ) : (

                <>

                  <PanelRightOpen className="mr-2 h-4 w-4" />

                  Show code

                </>

              )}

            </Button>

            {isHost && !roomEnded && (

              <Button

                variant="destructive"

                size="sm"

                onClick={() => setIsEndDialogOpen(true)}

                disabled={endRoomMutation.isPending}

              >

                <Power className="mr-2 h-4 w-4" />

                End room

              </Button>

            )}

          </div>

        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">

          <a

            href={room.meetLink}

            target="_blank"

            rel="noreferrer"

            className="flex items-center gap-1 underline-offset-2 hover:underline"

          >

            <ExternalLink className="h-3 w-3" />

            {shortMeetLink}

          </a>

          {questionLink ? (

            <>

              <Separator orientation="vertical" className="hidden h-5 sm:flex" />

              <a

                href={questionLink}

                target="_blank"

                rel="noreferrer"

                className="flex items-center gap-1 underline-offset-2 hover:underline"

              >

                <Link2 className="h-3 w-3" />

                {shortQuestionLink}

              </a>

            </>

          ) : null}

        </div>

        {roomEnded && (

          <p className="mt-2 text-xs text-destructive">

            This room has been closed. You can still review the shared canvas and code.

          </p>

        )}

      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Excalidraw
            excalidrawAPI={(api) => {
              excalidrawAPIRef.current = api;
              if (!initialSceneLoaded.current) {
                const hydratedScene = rehydrateScene(room.canvasData);
                if (hydratedScene) {
                  api.updateScene(hydratedScene as any);
                  initialSceneLoaded.current = true;
                }
              }
            }}
            onChange={handleCanvasChange}
            onPointerUpdate={handlePointerUpdate}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveAsImage: true,
                changeViewBackgroundColor: true,
              },
            }}
            viewModeEnabled={false}
          />
        </div>

        <AnimatePresence initial={false}>
          {isEditorOpen && (
            <motion.aside
              key="editor"
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute right-0 top-0 z-10 h-full w-full max-w-xl border-l border-white/10 bg-neutral-900/95 backdrop-blur"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Shared Code</p>
                    <p className="text-xs text-slate-400">Debounced updates every few hundred milliseconds</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditorOpen(false)}>
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
                <Editor
                  theme="vs-dark"
                  height="100%"
                  language="javascript"
                  value={codeValue}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    smoothScrolling: true,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                  }}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {roomEnded && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm">
            <Card className="pointer-events-auto w-full max-w-md border border-destructive/40 bg-neutral-900/90 p-6 text-center">
              <p className="text-sm text-destructive">This room has been closed by the host.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleOpenMeet}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Meet
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to dashboard
                </Button>
              </div>
            </Card>
          </div>
        )}
        {!isEditorOpen && (
          <div className="pointer-events-none absolute inset-0 flex justify-end p-4">
            <Button
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full bg-neutral-800/90 text-slate-200 hover:bg-neutral-700"
              onClick={() => setIsEditorOpen(true)}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          </div>
        )}
      <InviteFriendsDialog
        roomId={room.roomId}
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
      <QuestionLinkDialog
        open={isQuestionDialogOpen}
        initialValue={questionLink}
        onOpenChange={setIsQuestionDialogOpen}
        onSave={handleQuestionLinkSave}
      />
      <AlertDialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End live room?</AlertDialogTitle>
            <AlertDialogDescription>
              Ending the room disconnects everyone and stops realtime updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={endRoomMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={endRoomMutation.isPending}
              onClick={() => endRoomMutation.mutate()}
            >
              End room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
