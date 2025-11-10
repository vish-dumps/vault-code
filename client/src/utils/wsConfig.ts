/**
 * WebSocket Configuration Utility
 * Provides runtime-safe WebSocket setup with environment fallback
 */

export interface WebSocketConfig {
  url: string;
  port: number;
  host: string;
}

/**
 * Get WebSocket configuration from environment variables with fallbacks
 */
export function getWebSocketConfig(): WebSocketConfig {
  const port = Number(import.meta.env.VITE_WS_PORT) || 5001;
  const host = window.location.hostname || 'localhost';
  const envUrl = import.meta.env.VITE_WS_URL;
  
  // Use environment URL if defined, otherwise construct from host and port
  const url = envUrl || `ws://${host}:${port}`;
  
  return { url, port, host };
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
    
    console.log('[WebSocket] Connecting to:', config.url);
    console.log('[WebSocket] Port:', config.port);
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
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  
  // Check if we have an environment variable for WebSocket URL
  const envWsUrl = import.meta.env.VITE_WS_URL;
  
  if (envWsUrl) {
    return envWsUrl;
  }
  
  // Fallback to constructing URL from current location
  return `${protocol}://${host}/ws`;
}
