import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "../auth";
import { Room } from "../models/Room";

type SocketUserData = {
  userId: string;
  username?: string;
};

type CanvasUpdatePayload = {
  roomId: string;
  scene: Record<string, unknown>;
};

type CodeUpdatePayload = {
  roomId: string;
  code: string;
  language?: string;
};

type CursorUpdatePayload = {
  roomId: string;
  userId?: string;
  username?: string;
  pointer?: { x: number; y: number } | null;
};

type CanvasScene = {
  appState?: Record<string, unknown>;
  [key: string]: unknown;
};

type PendingRoomState = {
  canvasData?: CanvasScene | null;
  codeData?: string;
  questionLink?: string | null;
};

type RoomMember = {
  socketId: string;
  userId: string;
  username?: string;
};

function sanitizeScene(scene: unknown): CanvasScene | null {
  if (!scene || typeof scene !== "object") {
    return null;
  }

  const typedScene = scene as CanvasScene;
  const sanitized: CanvasScene = { ...typedScene };

  if (typedScene.appState && typeof typedScene.appState === "object") {
    const { collaborators: _ignored, ...restAppState } = typedScene.appState;
    sanitized.appState = { ...restAppState };
  }

  return sanitized;
}

let ioInstance: Server | null = null;

const pendingRoomState = new Map<
  string,
  PendingRoomState
>();

const persistTimers = new Map<string, NodeJS.Timeout>();
const roomMembers = new Map<string, Map<string, RoomMember>>();

function schedulePersist(roomId: string) {
  if (persistTimers.has(roomId)) {
    return;
  }

  const timer = setTimeout(async () => {
    persistTimers.delete(roomId);
    const state = pendingRoomState.get(roomId);
    if (!state) return;

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (state.canvasData !== undefined) {
      update.canvasData = state.canvasData ?? null;
    }
    if (state.codeData !== undefined) {
      update.codeData = state.codeData;
    }
    if (state.questionLink !== undefined) {
      update.questionLink = state.questionLink ?? null;
    }

    try {
      await Room.findOneAndUpdate({ roomId }, update, { upsert: false });
    } catch (error) {
      console.error("Failed to persist room state", roomId, error);
    }
  }, 350);

  persistTimers.set(roomId, timer);
}

export function initMeetRoomsSocket(server: HttpServer) {
  const io = new Server(server, {
    path: "/socket.io/meet-rooms",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    serveClient: false,
    transports: ['websocket', 'polling'],
  });
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Authentication required"));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error("Invalid token"));
    }

    (socket.data as SocketUserData).userId = payload.userId;
    (socket.data as SocketUserData).username = payload.username;

    return next();
  });

  io.on("connection", (socket) => {
    socket.on("join_room", async (message: { roomId?: string }) => {
      const roomId = message?.roomId?.trim();
      if (!roomId) {
        socket.emit("room:error", { message: "Room identifier is required." });
        return;
      }

      try {
        const room = await Room.findOne({ roomId }).lean();
        if (!room) {
          socket.emit("room:error", { message: "Room not found." });
          return;
        }

        if (room.endedAt) {
          socket.emit("room:error", { message: "This room has already ended." });
          return;
        }

        socket.join(roomId);

        const userData = socket.data as SocketUserData;
        const membersForRoom = roomMembers.get(roomId) ?? new Map<string, RoomMember>();
        const member: RoomMember = {
          socketId: socket.id,
          userId: userData.userId,
          username: userData.username,
        };
        membersForRoom.set(socket.id, member);
        roomMembers.set(roomId, membersForRoom);

        const existingState = pendingRoomState.get(roomId);
        const state: PendingRoomState = existingState ?? {};
        if (!existingState) {
          pendingRoomState.set(roomId, state);
        }
        if (state.questionLink === undefined) {
          state.questionLink = room.questionLink ?? null;
        }

        const persistedScene = sanitizeScene(room.canvasData);
        const scenePayload = state.canvasData ?? persistedScene ?? null;
        const questionLink = state.questionLink ?? room.questionLink ?? null;

        socket.emit("room_state", {
          canvasData: scenePayload,
          codeData: state.codeData ?? room.codeData ?? "",
          questionLink,
          meetLink: room.meetLink,
          createdByName: room.createdByName,
          members: Array.from(membersForRoom.values()).map(({ socketId, userId, username }) => ({
            socketId,
            userId,
            username,
          })),
        });

        socket.to(roomId).emit("room_presence", {
          type: "joined",
          member: {
            socketId: member.socketId,
            userId: member.userId,
            username: member.username,
          },
        });
      } catch (error) {
        console.error("Failed to join room", roomId, error);
        socket.emit("room:error", { message: "Failed to join room." });
      }
    });

    socket.on("canvas_update", (payload: CanvasUpdatePayload) => {
      const roomId = payload?.roomId;
      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      if (!payload.scene || typeof payload.scene !== "object") {
        return;
      }

      const canvasScene = sanitizeScene(payload.scene);
      if (!canvasScene) {
        return;
      }

      const state: PendingRoomState = pendingRoomState.get(roomId) ?? {};
      state.canvasData = canvasScene;
      pendingRoomState.set(roomId, state);

      socket.to(roomId).emit("canvas_update", {
        scene: canvasScene,
      });

      schedulePersist(roomId);
    });

    socket.on("code_update", (payload: CodeUpdatePayload) => {
      const roomId = payload?.roomId;
      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      if (typeof payload.code !== "string") {
        return;
      }

      const state: PendingRoomState = pendingRoomState.get(roomId) ?? {};
      state.codeData = payload.code;
      pendingRoomState.set(roomId, state);

      socket.to(roomId).emit("code_update", {
        code: payload.code,
        language: payload.language,
      });

      schedulePersist(roomId);
    });

    socket.on("cursor_update", (payload: CursorUpdatePayload) => {
      const roomId = payload?.roomId?.trim();
      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      const data = socket.data as SocketUserData;
      const pointer =
        payload.pointer && typeof payload.pointer.x === "number" && typeof payload.pointer.y === "number"
          ? { x: payload.pointer.x, y: payload.pointer.y }
          : null;

      socket.to(roomId).emit("cursor_update", {
        userId: payload.userId ?? data.userId,
        username: payload.username ?? data.username,
        pointer,
      });
    });

    socket.on("question_update", (payload: { roomId?: string; questionLink?: string | null }) => {
      const roomId = payload?.roomId?.trim();
      if (!roomId || !socket.rooms.has(roomId)) {
        return;
      }

      const nextValue = typeof payload.questionLink === "string" ? payload.questionLink.trim() : "";
      const state: PendingRoomState = pendingRoomState.get(roomId) ?? {};
      state.questionLink = nextValue.length ? nextValue : null;
      pendingRoomState.set(roomId, state);

      socket.to(roomId).emit("question_update", {
        questionLink: state.questionLink ?? null,
      });

      schedulePersist(roomId);
    });

    socket.on("disconnect", () => {
      const data = socket.data as SocketUserData;
      socket.rooms.forEach((roomId) => {
        if (roomId === socket.id) return;
        const membersForRoom = roomMembers.get(roomId);
        if (membersForRoom) {
          membersForRoom.delete(socket.id);
          if (!membersForRoom.size) {
            roomMembers.delete(roomId);
          }
        }
        socket.to(roomId).emit("room_presence", {
          type: "left",
          member: {
            socketId: socket.id,
            userId: data.userId,
            username: data.username,
          },
        });
      });
    });
  });
}

export function closeRoom(roomId: string) {
  const timer = persistTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    persistTimers.delete(roomId);
  }

  pendingRoomState.delete(roomId);
  roomMembers.delete(roomId);

  if (ioInstance) {
    ioInstance.to(roomId).emit("room_closed", { roomId });
    ioInstance.in(roomId).socketsLeave(roomId);
  }
}
