import { io, Socket } from "socket.io-client";

const DEFAULT_PROD_BACKEND = "https://codevault-backend.onrender.com";
const DEFAULT_DEV_BACKEND = "http://localhost:5001";

let socketInstance: Socket | null = null;

function resolveBackendUrl(): string {
  const rawEnv = import.meta.env.VITE_BACKEND_URL?.trim();
  const isLocalhost = (value: string) => value.includes("localhost") || value.includes("127.0.0.1");

  if (rawEnv && !(import.meta.env.PROD && isLocalhost(rawEnv))) {
    return rawEnv.replace(/\/+$/, "");
  }

  if (import.meta.env.PROD) {
    return DEFAULT_PROD_BACKEND;
  }

  return DEFAULT_DEV_BACKEND;
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const connectionUrl = resolveBackendUrl();

    console.log("[Socket] Initializing with URL:", connectionUrl);
    console.log("[Socket] Path: /socket.io/meet-rooms");

    // Use callback for auth to ensure latest token is always used on connection/reconnection
    const authPayload = (cb: (data: object) => void) => {
      const currentToken = localStorage.getItem("authToken") ?? localStorage.getItem("token");
      console.log("[Socket] Authenticating with token present:", !!currentToken);
      cb({ token: currentToken });
    };

    socketInstance = io(connectionUrl, {
      path: "/socket.io/meet-rooms",
      auth: authPayload,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: false,
    });

    // Global error handling
    socketInstance.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected successfully");
    });
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance.removeAllListeners();
    socketInstance = null;
  }
}
