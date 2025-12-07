# Deployment Dependency Notes

## Why devDependencies are safe for Vercel/Render
- **Vercel** installs devDependencies by default, so the frontend build (Vite) can run without promoting Vite/TypeScript/Esbuild to production deps.
- **Render** installs only production dependencies for the `/server` service. Vite/Esbuild are not needed there because the backend is pure Express/TypeScript. Keeping build tooling out of Render’s production deps avoids unnecessary installs and prevents Vite-related build failures.

## Current layout (dual deployment)
- **Root `package.json`**: Vite, TypeScript, and Esbuild live in `devDependencies` and are used for local/full builds. Production deps are app/runtime only.
- **`server/package.json`**: No Vite/Esbuild listed — only server-side libraries (Express, Mongoose, Nodemailer, etc.).
- **Client build (Vercel)**: Uses the root devDependencies (includes Vite) when building the frontend.
- **Backend build (Render)**: Uses `cd server && npm run build` with server-only deps; devDependencies are ignored.

## Scripts and usage
- Local/full build: `npm run build` (root) -> Vite client build + Esbuild bundle for the server.
- Render build: `cd server && npm run build` (as configured) -> server-only build, no Vite involved.
- Vercel build: runs the Vite client build using devDependencies.

This separation keeps production images small and avoids frontend tooling leaks into the backend deploy.
