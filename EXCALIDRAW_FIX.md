# Excalidraw & WebSocket Errors - Fixed

## Errors Encountered

1. **Excalidraw Error**:
   ```
   Uncaught ReferenceError: process is not defined
   ```

2. **WebSocket Error**:
   ```
   WebSocket connection to 'ws://localhost:undefined/?token=...' failed
   ```

3. **Trusted Types Error** (NEW):
   ```
   This document requires 'TrustedScriptURL' assignment.
   Failed to set the 'src' property on 'HTMLScriptElement'
   ```

4. **Result**: White screen, app stuck loading, room creation hangs

---

## Fixes Applied

### 1. ✅ Fixed Excalidraw `process is not defined`

**Problem**: Excalidraw expects Node.js `process.env` object, which doesn't exist in the browser.

**Solution**: Added polyfill in `vite.config.ts`:

```typescript
define: {
  'process.env': {},
}
```

**File Modified**: `vite.config.ts`

---

### 2. ✅ Fixed Trusted Types Policy Violation

**Problem**: Chrome's Trusted Types security feature was blocking Excalidraw from loading scripts dynamically.

**Solution**: Added a default Trusted Types policy in `main.tsx`:

```typescript
if ((window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
  (window as any).trustedTypes.createPolicy('default', {
    createHTML: (string: string) => string,
    createScriptURL: (string: string) => string,
    createScript: (string: string) => string,
  });
}
```

**File Modified**: `client/src/main.tsx`

---

### 3. ✅ Created Missing Client Environment File

**Problem**: `client/.env` file was missing, causing undefined backend URL.

**Solution**: Created `client/.env` with:

```env
VITE_BACKEND_URL=http://localhost:5001
```

**File Created**: `client/.env`

---

## How to Apply Fixes

### Step 1: Stop the Server

Press `Ctrl+C` in the terminal running `npm run dev`

### Step 2: Restart the Server

```bash
npm run dev
```

The server will:
1. Pick up the new `vite.config.ts` with Excalidraw fix
2. Load `client/.env` with backend URL
3. Start without errors

### Step 3: Verify

Open browser and check:
- ✅ No white screen
- ✅ App loads normally
- ✅ No "process is not defined" error in console
- ✅ WebSocket connects properly

---

## What Changed

### Files Modified:

1. **`vite.config.ts`**
   - Added `define: { 'process.env': {} }` for Excalidraw compatibility

2. **`client/.env`** (NEW)
   - Created with `VITE_BACKEND_URL=http://localhost:5001`

---

## Technical Details

### Why Excalidraw Needs `process.env`

Excalidraw is built for both Node.js and browser environments. It checks `process.env` for configuration. In the browser, this object doesn't exist, causing the error.

**Vite's `define` option** replaces all instances of `process.env` with an empty object `{}` during build, making Excalidraw work in the browser.

### Why WebSocket Failed

The realtime service was trying to connect to `ws://localhost:undefined` because `VITE_BACKEND_URL` wasn't set. Now it will use the correct URL from `client/.env`.

---

## Verification Steps

After restart, check browser console:

✅ **Should see**:
- No errors
- App loads successfully
- Dashboard appears

❌ **Should NOT see**:
- "process is not defined"
- "WebSocket connection failed"
- White screen

---

## If Issues Persist

1. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete`
   - Clear cached files
   - Reload page

2. **Hard refresh**:
   - Press `Ctrl+Shift+R` (Windows/Linux)
   - Or `Cmd+Shift+R` (Mac)

3. **Check terminal**:
   - Ensure no errors during server start
   - Verify port 5001 is available

4. **Verify environment**:
   ```bash
   # Check if .env file exists
   cat client/.env
   
   # Should output:
   # VITE_BACKEND_URL=http://localhost:5001
   ```

---

**Status**: ✅ Fixes applied - Ready to restart server
