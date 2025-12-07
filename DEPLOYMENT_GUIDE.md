# Deployment Guide: Render & Vercel

This guide outlines the steps to deploy your full-stack application. We will deploy the **Backend** (Node.js/Express) to **Render** and the **Frontend** (React/Vite) to **Vercel**.

## Prerequisites

1.  A [GitHub](https://github.com/) repository with your code pushed.
2.  A [Render](https://render.com/) account.
3.  A [Vercel](https://vercel.com/) account.
4.  A MongoDB Atlas URI (or another MongoDB provider).

---

## Part 1: Backend Deployment (Render)

1.  **Dashboard**: Log in to Render and click **New +** -> **Web Service**.
2.  **Repository**: Connect your GitHub repository.
3.  **Settings**:
    *   **Name**: Choose a name (e.g., `codevault-backend`).
    *   **Region**: Select a region close to you.
    *   **Branch**: `main` (or your working branch).
    *   **Root Directory**: Leave blank (default).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install && npm run build`
        *   *Note: This runs the full build including frontend, which is fine, but ensures the server transpiles correctly.*
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    Scroll down to "Environment Variables" and add:
    *   `DATABASE_URL`: Your valid MongoDB connection string.
    *   `SESSION_SECRET`: A long random string (e.g., generated via a password manager).
    *   `NODE_ENV`: `production`
5.  **Deploy**: Click **Create Web Service**.
6.  **Wait**: Wait for the build to finish. Once "Live", copy the **Service URL** (e.g., `https://codevault-backend.onrender.com`). You will need this for the frontend.

---

## Part 2: Frontend Deployment (Vercel)

1.  **Configuration**: I have added a `vercel.json` file to your project root. **You must edit this file** before deploying if you want to use the API proxy.
    *   Open `vercel.json`.
    *   Replace `https://YOUR-RENDER-BACKEND-URL.onrender.com` with the **Service URL** you got from Render in Part 1.
    *   *Alternative*: You can also configure this using Vercel Environment Variables if you modify the code to use `VITE_API_URL`, but the rewrite approach in `vercel.json` is often simpler for handling Cookies/CORS.

2.  **Dashboard**: Log in to Vercel and click **Add New** -> **Project**.
3.  **Repository**: Import your GitHub repository.
4.  **Project Configuration**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: Leave as `./` (root).
    *   **Build Command**: `npm run build` (or `vite build --config vite.config.ts`)
    *   **Output Directory**: `dist/public`
        *   *Important*: The default is usually `dist`, but your `vite.config.ts` specifies `dist/public`. Vercel needs to know this.
5.  **Deploy**: Click **Deploy**.

---

## Part 3: Post-Deployment Configuration

### Socket.io / Real-time Features
Your application uses Socket.io. Vercel rewrites (configured in `vercel.json`) handle standard HTTP API requests well, but WebSocket connections often need to connect directly to the backend.

1.  If your real-time features (chat, whiteboard) fail to connect, you may need to update your client-side socket connection logic to point explicitly to the Render URL in production.
2.  Check `client/src/lib/socket.ts` (or similar file) to ensure it uses the correct URL.
    *   *Current behavior*: It likely tries to connect to the same origin (`/`).
    *   *Fix*: If using `vercel.json` rewrites, standard polling might work, but for best performance, ensure your backend CORS is configured to accept connections from your Vercel domain.

### Database
Ensure your IP Access List in MongoDB Atlas allows access from **Anywhere (0.0.0.0/0)** since Render (and Vercel) IPs are dynamic.

---

## Troubleshooting

-   **White Screen on Vercel**: Check the "Output Directory" setting. It MUST be `dist/public`.
-   **API Errors**: Check the `vercel.json` destination URL.
-   **CORS Errors**: If making direct requests (skipping the proxy), verify `server/index.ts` has the correct `Access-Control-Allow-Origin` for your Vercel domain. The current configuration allows `*` (all origins), which is permissible for initial testing but should be secured later.
