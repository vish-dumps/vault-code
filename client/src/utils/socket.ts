import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
    const token = localStorage.getItem("authToken") ?? localStorage.getItem("token");

    console.log("[Socket] Initializing with URL:", backendUrl);
    console.log("[Socket] Path: /socket.io/meet-rooms");
    console.log("[Socket] Token present:", !!token);

    socketInstance = io(backendUrl, {
      path: "/socket.io/meet-rooms",
      auth: { token },
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
