import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";

type RealtimeMessage = {
  event?: string;
  payload?: Record<string, unknown>;
};

export function useRealtimeSubscriptions() {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number>();

  useEffect(() => {
    function cleanupSocket() {
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = undefined;
      }
    }

    if (!isAuthenticated || !token) {
      cleanupSocket();
      return;
    }

    let isStopped = false;

    const connect = () => {
      if (isStopped) return;

      try {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://${window.location.host}/ws`;
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(JSON.stringify({ type: "auth", token }));
        };

        socket.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            if (!message?.event) return;

            switch (message.event) {
              case "activity:new":
                queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
                break;
              case "leaderboard:update":
                queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
                queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/history"] });
                break;
              case "friends:request":
              case "friends:accepted":
              case "friends:declined":
              case "friends:cancelled":
              case "friends:removed":
                queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
                queryClient.invalidateQueries({ queryKey: ["/api/users/me/friends"] });
                break;
              case "notifications:new":
              case "notifications:updated":
                queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                break;
              case "answers:upvote":
              case "answers:rating":
              case "answers:comment":
              case "answers:suggestion":
              case "answers:suggestion:reviewed": {
                queryClient.invalidateQueries({ queryKey: ["/api/answers"] });
                const answerId = message.payload?.answerId as string | undefined;
                if (answerId) {
                  queryClient.invalidateQueries({ queryKey: ["/api/answers", answerId] });
                }
                break;
              }
              default:
                break;
            }
          } catch (error) {
            console.warn("Realtime message parse error", error);
          }
        };

        socket.onclose = () => {
          socketRef.current = null;
          if (!isStopped) {
            reconnectTimer.current = window.setTimeout(connect, 3000);
          }
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch (error) {
        console.error("Realtime connection error:", error);
        reconnectTimer.current = window.setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isStopped = true;
      cleanupSocket();
    };
  }, [isAuthenticated, token]);
}
