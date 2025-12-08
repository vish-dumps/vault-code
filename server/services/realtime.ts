import type { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../auth';

interface ClientContext {
  socket: WebSocket;
  userId?: string;
  username?: string;
  isAlive: boolean;
}

export let wss: WebSocketServer | undefined;
const connections = new Map<WebSocket, ClientContext>();
const userSockets = new Map<string, Set<WebSocket>>();

function attachClient(socket: WebSocket) {
  const context: ClientContext = { socket, isAlive: true };
  connections.set(socket, context);

  socket.on('pong', () => {
    context.isAlive = true;
  });

  socket.on('close', () => {
    removeSocket(socket);
  });
}

function removeSocket(socket: WebSocket) {
  const context = connections.get(socket);
  if (!context) return;

  connections.delete(socket);

  if (context.userId) {
    const sockets = userSockets.get(context.userId);
    if (sockets) {
      sockets.delete(socket);
      if (!sockets.size) {
        userSockets.delete(context.userId);
      }
    }
  }
}

function registerAuthenticatedClient(
  socket: WebSocket,
  userId: string,
  username: string
) {
  const context = connections.get(socket);
  if (!context) return;

  context.userId = userId;
  context.username = username;

  let sockets = userSockets.get(userId);
  if (!sockets) {
    sockets = new Set();
    userSockets.set(userId, sockets);
  }
  sockets.add(socket);
}

function emit(socket: WebSocket, event: string, payload: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, payload }));
  }
}

function startHeartbeat() {
  if (!wss) return;

  const interval = setInterval(() => {
    connections.forEach((context, socket) => {
      if (!context.isAlive) {
        socket.terminate();
        removeSocket(socket);
        return;
      }

      context.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));
}

export function initRealtime(server: Server) {
  // Use noServer mode so we can manually route upgrade requests in index.ts
  wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (socket) => {
    attachClient(socket);

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (!message || typeof message !== 'object') return;

        switch (message.type) {
          case 'auth': {
            const token = message.token;
            if (!token || typeof token !== 'string') {
              emit(socket, 'auth:error', { message: 'Token required' });
              return;
            }

            const payload = verifyToken(token);
            if (!payload) {
              emit(socket, 'auth:error', { message: 'Invalid token' });
              return;
            }

            registerAuthenticatedClient(socket, payload.userId, payload.username);
            emit(socket, 'auth:success', {
              userId: payload.userId,
              username: payload.username,
            });
            break;
          }
          case 'ping': {
            emit(socket, 'pong', { ts: Date.now() });
            break;
          }
          default:
            break;
        }
      } catch (error) {
        emit(socket, 'error', { message: 'Malformed payload' });
      }
    });
  });

  startHeartbeat();
}

export function broadcast(event: string, payload: unknown) {
  connections.forEach((_context, socket) => {
    emit(socket, event, payload);
  });
}

export function broadcastToUsers(userIds: Iterable<string>, event: string, payload: unknown) {
  for (const userId of Array.from(userIds)) {
    const sockets = userSockets.get(userId);
    if (!sockets) continue;
    sockets.forEach((socket) => emit(socket, event, payload));
  }
}

export function notifyUser(userId: string, event: string, payload: unknown) {
  broadcastToUsers([userId], event, payload);
}

export function getConnectedUserIds(): string[] {
  return Array.from(userSockets.keys());
}
