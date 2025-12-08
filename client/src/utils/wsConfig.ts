/**
 * WebSocket Configuration Utility
 * Provides runtime-safe WebSocket setup with environment fallback
 */

export interface WebSocketConfig {
  url: string;
  port: number;
  host: string;
}

const DEFAULT_PROD_BACKEND = "https://codevault-backend-tpqh.onrender.com";
const DEFAULT_DEV_BACKEND = "http://localhost:5001";

function isLocalhost(value?: string) {
  return Boolean(value && (value.includes("localhost") || value.includes("127.0.0.1")));
}

function normalizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, "");
}

function resolveHttpBackendBase(): string {
  const envBackend = normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL);
  if (envBackend && !(import.meta.env.PROD && isLocalhost(envBackend))) {
    return envBackend;
  }
  if (import.meta.env.PROD) {
    return DEFAULT_PROD_BACKEND;
  }
  return DEFAULT_DEV_BACKEND;
}

function resolveWebSocketBase(): string {
  const envWs = normalizeBaseUrl(import.meta.env.VITE_WS_URL);
  if (envWs && !(import.meta.env.PROD && isLocalhost(envWs))) {
    return envWs;
  }
  const httpBase = resolveHttpBackendBase();
  return httpBase.replace(/^http/, "ws");
}

function withWsPath(base: string) {
  return base.endsWith("/ws") ? base : `${base}/ws`;
}

/**
 * Get WebSocket configuration from environment variables with fallbacks
 */
export function getWebSocketConfig(): WebSocketConfig {
  const port = Number(import.meta.env.VITE_WS_PORT) || 5001;
  const httpBase = resolveHttpBackendBase();
  const wsUrl = withWsPath(resolveWebSocketBase());

  let host = "localhost";
  try {
    host = new URL(httpBase).hostname;
  } catch {
    host = window.location.hostname || "localhost";
  }

  return { url: wsUrl, port, host };
}

/**
 * Setup WebSocket connection with proper error handling
 * @param token - Optional authentication token
 * @returns WebSocket instance or null if connection fails
 */
export function setupWebSocket(token?: string): WebSocket | null {
  try {
    const config = getWebSocketConfig();
    const tokenParam = token ? `?token=${token}` : '';
    const wsUrl = `${config.url}${tokenParam}`;

    console.log('[WebSocket] Connecting to:', wsUrl);
    console.log('[WebSocket] Host:', config.host);

    const socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      console.log('[WebSocket] Connected successfully');
    });

    socket.addEventListener('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    socket.addEventListener('close', () => {
      console.log('[WebSocket] Connection closed');
    });

    return socket;
  } catch (error) {
    console.error('[WebSocket] Failed to create connection:', error);
    return null;
  }
}

/**
 * Get WebSocket URL for realtime connections based on current location
 */
export function getRealtimeWebSocketUrl(): string {
  const { url } = getWebSocketConfig();
  return url;
}
