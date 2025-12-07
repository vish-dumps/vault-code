import react from "@vitejs/plugin-react";
import path from "path";

const config = {
  server: {
    host: true,
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
    force: true,
    esbuildOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
  define: {
    // Fix for Excalidraw - define process.env
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
};

export default config;
