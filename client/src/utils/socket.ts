import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    let backendUrl = import.meta.env.VITE_BACKEND_URL;

    // In production, ignore localhost backend URL (likely from local .env)
    if (import.meta.env.PROD && backendUrl && (backendUrl.includes("localhost") || backendUrl.includes("127.0.0.1"))) {
      backendUrl = undefined;
    }

    // Fallback to localhost default ONLY if not in production and no env var
    if (!backendUrl && !import.meta.env.PROD) {
      backendUrl = "http://localhost:5001";
    }

    const connectionUrl = backendUrl || undefined;

    console.log("[Socket] Initializing with URL:", connectionUrl || "window.location");
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
      transports: ["polling", "websocket"],
      upgrade: false,
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
