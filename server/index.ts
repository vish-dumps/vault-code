import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDummyData } from "./seedData";
import { connectToMongoDB } from "./mongodb";
import authRoutes from "./auth-routes";
import { initRealtime, wss } from "./services/realtime";
import { initMeetRoomsSocket } from "./services/meetRoomsSocket";

// Optimization: Compression
import compression from "compression";
import cors from "cors";

const app = express();

// Respect proxy headers on hosted providers (Render)
app.set("trust proxy", 1);

// Optimization: Compression
app.use(compression());

// Optimization: Request Timing
app.use((req, res, next) => {
  const start = Date.now();
  console.time(`${req.method} ${req.path}`);
  res.on('finish', () => {
    console.timeEnd(`${req.method} ${req.path}`);
  });
  next();
});

// Optimization: Health Check
app.get('/ping', (_req, res) => {
  res.status(200).send('pong');
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
// Accept slightly larger JSON bodies so avatar uploads (base64) don't fail
app.use(express.json({
  limit: "10mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!allowedOrigins.length) {
  allowedOrigins.push(
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    "http://localhost:5001",
    "https://www.code-v.me",
    "https://code-v.me",
    "https://codevault-backend.onrender.com"
  );
}

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow server-to-server and health checks
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  maxAge: 86400,
});

app.use(corsMiddleware);
app.options("*", corsMiddleware);

// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Connect to MongoDB
  await connectToMongoDB();

  // Seed dummy data on startup (only if no users exist)
  await seedDummyData();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  initRealtime(server);
  initMeetRoomsSocket(server, allowedOrigins);

  const upgradeListeners = server.listeners("upgrade");
  const viteUpgradeListener = upgradeListeners.find((fn) => fn.name === "hmrServerWsListener");

  // Remove existing listeners to handle routing manually
  server.removeAllListeners("upgrade");

  server.on("upgrade", (req, socket, head) => {
    const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : "";

    // 1. Handle Vite HMR (Development only)
    const protocolHeader = req.headers["sec-websocket-protocol"];
    const protocols = protocolHeader?.split(",").map((value) => value.trim());
    if (protocols?.includes("vite-hmr") && viteUpgradeListener) {
      viteUpgradeListener.call(server, req, socket, head);
      return;
    }

    // 2. Handle /ws path (Native WebSocket)
    // Import wss dynamically or assume it's available via module scope if I add import
    // Note: I will use the wss exported from realtime service.
    // Since I can't easily add import statement in this Replace block without touching top of file,
    // I will access it via require or rely on next step to add import.
    // Actually, I should use the wss returned/available from initRealtime? 
    // initRealtime returns nothing but sets the exported var.
    // I will rely on importing { wss } from "./services/realtime" at top of file. 
    // For now, I'll write the logic assuming 'wss' is available, and then add the import.

    if (pathname.startsWith("/ws")) {
      if (wss) {
        wss.handleUpgrade(req, socket, head, (ws: any) => {
          wss.emit('connection', ws, req);
        });
        return;
      }
    }

    // 3. Fallback to other listeners (like socket.io) or default behavior
    // If we removed all listeners, we need to manually call socket.io's listener if strictly necessary?
    // Socket.io attaches its listener when initialized. If we removed *all* listeners, we removed socket.io's too!
    // We captured 'upgradeListeners' BEFORE removing.
    // We should call the rest of them.
    const otherListeners = upgradeListeners.filter(fn => fn !== viteUpgradeListener);
    for (const listener of otherListeners) {
      listener.call(server, req, socket, head);
    }
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = "0.0.0.0"; // allow external listeners for Render/hosting
  server.listen(port, host, () => {
    log(`Server running on port ${port}`);
    log(`Frontend available at http://${host}:${port}`);
  });
})();
