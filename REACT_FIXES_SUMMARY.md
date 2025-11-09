# React Duplicate Issues - Fixes Applied

## Problems Identified

1. **Multiple React Instances**: The error "Invalid hook call" and "Cannot read properties of null (reading 'useState')" indicated multiple copies of React in the bundle.

2. **WebSocket URL Issue**: The error `ws://localhost:undefined/?token=...` was related to Vite's HMR configuration.

## Fixes Applied

### 1. Vite Configuration Updates (`vite.config.ts`)
- Added more aggressive React deduplication: `["react", "react-dom", "react/jsx-runtime"]`
- Added `optimizeDeps` with forced optimization to ensure all dependencies use the same React instance
- This forces Vite to pre-bundle React and ensures all modules use the same instance

### 2. Package.json Updates
- Added `resolutions` field to force React 18.3.1 across all dependencies (Yarn/pnpm)
- Added `overrides` field to force React 18.3.1 across all dependencies (npm)
- These ensure that even if a dependency specifies a different React version, npm/yarn will use the specified version

### 3. AuthContext.tsx Fix
- Removed default React import (`import React,`) and changed to named imports only
- This prevents potential conflicts with React's namespace export

### 4. Clean Installation Process
Created `FIX_REACT_ISSUES.bat` script that:
1. Removes `node_modules` directory completely
2. Removes `package-lock.json` to start fresh
3. Clears Vite cache (`client/.vite`)
4. Clears npm cache
5. Reinstalls all dependencies
6. Runs `npm dedupe` to remove duplicate packages

## Root Cause

The issue was caused by multiple packages bundling their own React instances. Common culprits include:
- `@excalidraw/excalidraw`
- `@monaco-editor/react`
- Various Radix UI components
- React Router dependencies

## How to Verify the Fix

After running the fix script:

1. Start the dev server: `npm run dev`
2. Open the browser console
3. Check that there are no "Invalid hook call" errors
4. Verify the app loads without white screen
5. Check that WebSocket connections work properly

## If Issues Persist

If you still see React duplicate errors:

1. Check for nested `node_modules` folders:
   ```bash
   powershell -Command "Get-ChildItem -Path node_modules -Recurse -Directory -Filter 'node_modules' | Select-Object -ExpandProperty FullName"
   ```

2. Verify React versions:
   ```bash
   npm list react react-dom
   ```

3. If any package shows a different React version, add it to the `overrides` section in package.json

4. Try using `npm ci` instead of `npm install` for a completely clean install

## Additional Notes

- The Vite `dedupe` option in `resolve.alias` ensures that if multiple packages import React, they all resolve to the same instance
- The `optimizeDeps.force` option forces Vite to rebuild the dependency cache
- Using named imports instead of default imports for React is a best practice to avoid namespace conflicts
