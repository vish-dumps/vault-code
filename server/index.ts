import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDummyData } from "./seedData";
import { connectToMongoDB } from "./mongodb";
import authRoutes from "./auth-routes";
import { initRealtime } from "./services/realtime";
import { initMeetRoomsSocket } from "./services/meetRoomsSocket";

// Optimization: Compression
import compression from "compression";

const app = express();

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

// Add CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
  initMeetRoomsSocket(server);

  const upgradeListeners = server.listeners("upgrade");
  const viteUpgradeListener = upgradeListeners.find((fn) => fn.name === "hmrServerWsListener");

  if (viteUpgradeListener) {
    const otherUpgradeListeners = upgradeListeners.filter((fn) => fn !== viteUpgradeListener);
    server.removeAllListeners("upgrade");
    server.on("upgrade", (req, socket, head) => {
      const protocolHeader = req.headers["sec-websocket-protocol"];
      const protocols = protocolHeader
        ?.split(",")
        .map((value) => value.trim());

      if (protocols?.includes("vite-hmr") && viteUpgradeListener) {
        viteUpgradeListener.call(server, req, socket, head);
        return;
      }

      for (const listener of otherUpgradeListeners) {
        listener.call(server, req, socket, head);
      }
    });
  }

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
