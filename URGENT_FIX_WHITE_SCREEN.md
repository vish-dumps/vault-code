# URGENT: Fix White Screen Issue

## Problem
App shows white screen with these errors:
1. **WebSocket URL is invalid** - `ws://localhost:undefined/?token=...`
2. **React hook errors** - "Invalid hook call" / "Cannot read properties of null"

## Root Causes
1. Missing `VITE_BACKEND_URL` environment variable
2. React duplicate instances not cleaned up

---

## IMMEDIATE FIX - Do This Now!

### Step 1: Stop Server
```bash
# Press Ctrl+C in terminal running npm run dev
```

### Step 2: Create Environment File

**I've already created `.env.local` with:**
```
VITE_BACKEND_URL=http://localhost:5001
```

✅ **This file is ready!**

### Step 3: Clean React Duplicates

**Run these commands in order:**

```bash
# Delete node_modules and package-lock
rmdir /s /q node_modules
del package-lock.json

# Clear Vite cache
rmdir /s /q client\.vite

# Clear npm cache
npm cache clean --force

# Reinstall
npm install --legacy-peer-deps

# Deduplicate
npm dedupe
```

**OR use the batch file:**
```bash
FIX_REACT_ISSUES.bat
```

### Step 4: Restart Server
```bash
npm run dev
```

---

## What I Fixed

### 1. Created `.env.local`
```env
VITE_BACKEND_URL=http://localhost:5001
```

This fixes the `ws://localhost:undefined` error.

### 2. Environment Variables Location

Vite looks for env files in this order:
1. `.env.local` (created ✅)
2. `.env.development.local`
3. `.env.development`
4. `.env`

The `.env.local` file will be loaded automatically by Vite.

---

## Why It Broke

### WebSocket Error
```typescript
// socket.ts uses this:
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
```

Without `.env.local`, `VITE_BACKEND_URL` was `undefined`.

### React Hook Error
Multiple React instances in `node_modules` from:
- Direct dependency
- Nested dependencies
- Vite cache conflicts

---

## Quick Verification

After running the fix:

### 1. Check Environment Variable
Open browser console after `npm run dev`:
```javascript
// Should log the backend URL
console.log(import.meta.env.VITE_BACKEND_URL);
// Expected: "http://localhost:5001"
```

### 2. Check React Version
```bash
npm ls react react-dom
```

Should show:
```
react@18.3.1
react-dom@18.3.1
```

NO duplicates!

### 3. Check WebSocket
Browser console should show:
```
[Socket] Initializing with URL: http://localhost:5001
[Socket] Connected successfully
```

NOT:
```
WebSocket connection to 'ws://localhost:undefined' failed
```

---

## If Still White Screen

### Check 1: Server Running?
```bash
# Should see:
Server running on http://localhost:5001
MongoDB connected successfully
```

### Check 2: Environment File Loaded?
```bash
# In browser console:
console.log(import.meta.env)
# Should include VITE_BACKEND_URL
```

### Check 3: React Still Duplicate?
```bash
npm ls react
# If shows multiple versions, run:
npm install --legacy-peer-deps --force
npm dedupe
```

### Check 4: Clear Browser Cache
```
Ctrl + Shift + Delete
Clear cache and hard reload: Ctrl + Shift + R
```

---

## Alternative: Nuclear Option

If nothing works, use the nuclear fix:

```bash
# Delete EVERYTHING
rmdir /s /q node_modules
rmdir /s /q client\.vite
del package-lock.json

# Reinstall from scratch
npm install --legacy-peer-deps
npm dedupe

# Restart
npm run dev
```

---

## Expected Result

After fix:
- ✅ No white screen
- ✅ Login page appears
- ✅ No React hook errors
- ✅ WebSocket connects to `ws://localhost:5001`
- ✅ No console errors

---

## Files Created/Modified

1. **`.env.local`** - Created with `VITE_BACKEND_URL`
2. **This guide** - To help you fix the issue

---

## Why .env.local?

- `.env.local` is **gitignored** by default
- **Higher priority** than `.env`
- **Development-specific** settings
- **Won't be committed** to version control

---

## Summary

**Problem:** Missing environment variable + React duplicates  
**Solution:** Created `.env.local` + Clean reinstall  
**Action Required:** Run Step 3 commands, then `npm run dev`  

**This should fix the white screen immediately!**
