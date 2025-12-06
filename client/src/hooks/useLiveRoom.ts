import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/utils/socket";
import { useToast } from "@/hooks/use-toast";

export type RoomMember = {
  socketId: string;
  userId: string;
  username?: string;
};

export type RoomState = {
  canvasData: Record<string, unknown> | null;
  codeData: string;
  codeLanguage: string;
  questionLink: string | null;
  meetLink: string;
  createdByName?: string;
  members: RoomMember[];
};

export type CursorPosition = {
  userId: string;
  username?: string;
  pointer: { x: number; y: number } | null;
};

export type CodeCursorPosition = {
  userId: string;
  username?: string;
  position: { lineNumber: number; column: number } | null;
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null;
};

export function useLiveRoom(roomId: string | null) {
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [codeCursors, setCodeCursors] = useState<Map<string, CodeCursorPosition>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const [joinRequests, setJoinRequests] = useState<Array<{ socketId: string; userId: string; username: string }>>([]);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [wasDenied, setWasDenied] = useState(false);

  // Throttle canvas updates
  const canvasUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const codeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const codeCursorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emitCanvasUpdate = useCallback(
    (scene: Record<string, unknown>) => {
      if (!socketRef.current || !roomId) return;

      if (canvasUpdateTimeoutRef.current) {
        clearTimeout(canvasUpdateTimeoutRef.current);
      }

      canvasUpdateTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("canvas_update", { roomId, scene });
      }, 200); // 200ms throttle
    },
    [roomId]
  );

  const emitCodeUpdate = useCallback(
    (code?: string, language?: string) => {
      if (!socketRef.current || !roomId) return;

      const hasCode = typeof code === "string";
      const trimmedLanguage = typeof language === "string" ? language.trim() : undefined;
      const hasLanguage = Boolean(trimmedLanguage);
      if (!hasCode && !hasLanguage) return;

      if (codeUpdateTimeoutRef.current) {
        clearTimeout(codeUpdateTimeoutRef.current);
      }
      if (codeCursorUpdateTimeoutRef.current) {
        clearTimeout(codeCursorUpdateTimeoutRef.current);
      }

      codeUpdateTimeoutRef.current = setTimeout(() => {
        const payload: Record<string, unknown> = { roomId };
        if (hasCode) payload.code = code;
        if (hasLanguage) payload.language = trimmedLanguage;
        socketRef.current?.emit("code_update", payload);
      }, 300); // 300ms debounce
    },
    [roomId]
  );

  const emitCursorUpdate = useCallback(
    (pointer: { x: number; y: number } | null) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit("cursor_update", { roomId, pointer });
    },
    [roomId]
  );

  const emitQuestionUpdate = useCallback(
    (questionLink: string | null) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit("question_update", { roomId, questionLink });
    },
    [roomId]
  );

  const emitCodeCursorUpdate = useCallback(
    (payload: {
      position?: { lineNumber: number; column: number } | null;
      selection?: CodeCursorPosition["selection"];
    }) => {
      if (!socketRef.current || !roomId) return;

      if (codeCursorUpdateTimeoutRef.current) {
        clearTimeout(codeCursorUpdateTimeoutRef.current);
      }

      codeCursorUpdateTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("code_cursor_update", {
          roomId,
          position: payload.position ?? null,
          selection: payload.selection ?? null,
        });
      }, 100);
    },
    [roomId]
  );

  const askToJoin = useCallback(() => {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit("ask_to_join", { roomId });
    setWaitingForApproval(true);
  }, [roomId]);

  const respondToJoinRequest = useCallback((socketId: string, approved: boolean) => {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit("admin_response", { socketId, approved, roomId });
    setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
  }, [roomId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      if (!mountedRef.current) return;
      console.log("[useLiveRoom] Socket connected");
      setIsConnected(true);
      setError(null);
      socket.emit("join_room", { roomId });
    };

    const handleDisconnect = () => {
      if (!mountedRef.current) return;
      console.log("[useLiveRoom] Socket disconnected");
      setIsConnected(false);
    };

    const handleRoomState = (state: RoomState) => {
      if (!mountedRef.current) return;
      console.log("[useLiveRoom] Received room state");
      setRoomState(state);
      setAccessDenied(false);
      setWaitingForApproval(false);
    };

    const handleCanvasUpdate = (payload: { scene: Record<string, unknown> }) => {
      if (!mountedRef.current) return;
      setRoomState((prev) => (prev ? { ...prev, canvasData: payload.scene } : null));
    };

    const handleCodeUpdate = (payload: { code: string; language?: string }) => {
      if (!mountedRef.current) return;
      setRoomState((prev) =>
        prev ? { ...prev, codeData: payload.code, codeLanguage: payload.language ?? prev.codeLanguage } : null
      );
    };

    const handleCursorUpdate = (payload: CursorPosition) => {
      if (!mountedRef.current) return;
      setCursors((prev) => {
        const next = new Map(prev);
        if (payload.pointer) {
          next.set(payload.userId, payload);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    const handleQuestionUpdate = (payload: { questionLink: string | null }) => {
      if (!mountedRef.current) return;
      setRoomState((prev) => (prev ? { ...prev, questionLink: payload.questionLink } : null));
    };

    const handleCodeCursorUpdate = (payload: CodeCursorPosition) => {
      if (!mountedRef.current) return;
      setCodeCursors((prev) => {
        const next = new Map(prev);
        if (payload.position) {
          next.set(payload.userId, payload);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    const handleRoomPresence = (payload: { type: "joined" | "left"; member: RoomMember }) => {
      if (!mountedRef.current) return;
      setRoomState((prev) => {
        if (!prev) return null;
        const members = [...prev.members];
        if (payload.type === "joined") {
          if (!members.some((m) => m.socketId === payload.member.socketId)) {
            members.push(payload.member);
          }
        } else {
          const index = members.findIndex((m) => m.socketId === payload.member.socketId);
          if (index >= 0) {
            members.splice(index, 1);
          }
        }
        return { ...prev, members };
      });
      if (payload.type === "left" && payload.member) {
        setCodeCursors((prev) => {
          const next = new Map(prev);
          next.delete(payload.member.userId);
          return next;
        });
      }
      if (payload.member?.socketId && payload.member.socketId === socketRef.current?.id) {
        return;
      }
      if (payload.member?.username) {
        toast({
          title: payload.type === "joined" ? "Joined room" : "Left room",
          description: payload.member.username,
        });
      }
    };

    const handleRoomError = (payload: { message: string }) => {
      if (!mountedRef.current) return;
      console.error("[useLiveRoom] Room error:", payload.message);
      setError(payload.message);
      toast({
        title: "Room error",
        description: payload.message,
        variant: "destructive",
      });
    };

    const handleRoomClosed = () => {
      if (!mountedRef.current) return;
      toast({
        title: "Room closed",
        description: "This room has been ended by the host.",
        variant: "destructive",
      });
      setError("Room has been closed");
    };

    const handleAccessDenied = () => {
      if (!mountedRef.current) return;
      setAccessDenied(true);
    };

    const handleJoinRequest = (payload: { socketId: string; userId: string; username: string }) => {
      if (!mountedRef.current) return;
      setJoinRequests(prev => [...prev, payload]);
      toast({
        title: "Join Request",
        description: `${payload.username} wants to join the room.`,
      });
    };

    const handleJoinApproved = () => {
      if (!mountedRef.current) return;
      setWaitingForApproval(false);
      setAccessDenied(false);
      socket.emit("join_room", { roomId });
      toast({
        title: "Approved!",
        description: "You have been approved to join the room.",
      });
    };

    const handleJoinDenied = () => {
      if (!mountedRef.current) return;
      setWaitingForApproval(false);
      setWasDenied(true);
      toast({
        title: "Denied",
        description: "Your request to join was denied.",
        variant: "destructive",
      });
    };

    // Attach listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room_state", handleRoomState);
    socket.on("canvas_update", handleCanvasUpdate);
    socket.on("code_update", handleCodeUpdate);
    socket.on("cursor_update", handleCursorUpdate);
    socket.on("code_cursor_update", handleCodeCursorUpdate);
    socket.on("question_update", handleQuestionUpdate);
    socket.on("room_presence", handleRoomPresence);
    socket.on("room:error", handleRoomError);
    socket.on("room_closed", handleRoomClosed);

    // Access control listeners
    socket.on("room:access_denied", handleAccessDenied);
    socket.on("join_request", handleJoinRequest);
    socket.on("join_approved", handleJoinApproved);
    socket.on("join_denied", handleJoinDenied);

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("join_room", { roomId });
    }

    // Cleanup
    return () => {
      if (canvasUpdateTimeoutRef.current) {
        clearTimeout(canvasUpdateTimeoutRef.current);
      }
      if (codeUpdateTimeoutRef.current) {
        clearTimeout(codeUpdateTimeoutRef.current);
      }

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room_state", handleRoomState);
      socket.off("canvas_update", handleCanvasUpdate);
      socket.off("code_update", handleCodeUpdate);
      socket.off("cursor_update", handleCursorUpdate);
      socket.off("code_cursor_update", handleCodeCursorUpdate);
      socket.off("question_update", handleQuestionUpdate);
      socket.off("room_presence", handleRoomPresence);
      socket.off("room:error", handleRoomError);
      socket.off("room_closed", handleRoomClosed);

      socket.off("room:access_denied", handleAccessDenied);
      socket.off("join_request", handleJoinRequest);
      socket.off("join_approved", handleJoinApproved);
      socket.off("join_denied", handleJoinDenied);

      // Emit leave_room on unmount
      socket.emit("leave_room", { roomId });

      // Don't disconnect socket here - let it persist for reconnection
      // socket.disconnect();
    };
  }, [roomId, toast]);

  return {
    isConnected,
    roomState,
    cursors,
    codeCursors,
    error,
    emitCanvasUpdate,
    emitCodeUpdate,
    emitCursorUpdate,
    emitQuestionUpdate,
    emitCodeCursorUpdate,
    // Access control
    accessDenied,
    waitingForApproval,
    wasDenied,
    joinRequests,
    askToJoin,
    respondToJoinRequest,
  };
}
