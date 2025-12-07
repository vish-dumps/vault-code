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
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    Scroll down to "Environment Variables" and add:
    *   `DATABASE_URL`: Your valid MongoDB connection string.
    *   `SESSION_SECRET`: A long random string (e.g., generated via a password manager).
    *   `NODE_ENV`: `production`
5.  **Deploy**: Click **Create Web Service**.

> [!IMPORTANT]
> **Build Error: `sh: 1: vite: not found`**
> If you see this error, it means Render is skipping "dev dependencies" like Vite because `NODE_ENV` is set to `production`.
>
> **Fix**: I have automatically updated your `package.json` to move `vite`, `esbuild`, and `typescript` to regular `dependencies`. This ensures they are installed even in production mode so the build command can run. You just need to push these changes to GitHub.

---

## Part 2: Frontend Deployment (Vercel)

1.  **Configuration**: I have added a `vercel.json` file to your project root. **You must edit this file** before deploying if you want to use the API proxy.
    *   Open `vercel.json`.
    *   Replace `https://YOUR-RENDER-BACKEND-URL.onrender.com` with the **Service URL** you got from Render in Part 1.
    *   *Alternative*: You can also configure this using Vercel Environment Variables if you modify the code to use `VITE_API_URL`.

2.  **Dashboard**: Log in to Vercel and click **Add New** -> **Project**.
3.  **Repository**: Import your GitHub repository.
4.  **Project Configuration**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: Leave as `./` (root).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist/public`
5.  **Deploy**: Click **Deploy**.

---

## Troubleshooting

-   **White Screen on Vercel**: Check the "Output Directory" setting. It MUST be `dist/public`.
-   **API Errors**: Check the `vercel.json` destination URL.
-   **CORS**: If making direct requests (skipping the proxy), verify `server/index.ts` has the correct `Access-Control-Allow-Origin`.
