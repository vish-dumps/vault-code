@echo off
echo ========================================
echo FIXING WHITE SCREEN ISSUE
echo ========================================
echo.

echo Step 1: Cleaning node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 2: Clearing Vite cache...
if exist client\.vite rmdir /s /q client\.vite

echo.
echo Step 3: Clearing npm cache...
call npm cache clean --force

echo.
echo Step 4: Reinstalling dependencies...
call npm install --legacy-peer-deps

echo.
echo Step 5: Deduplicating packages...
call npm dedupe

echo.
echo ========================================
echo FIX COMPLETE!
echo ========================================
echo.
echo The .env.local file has been created with:
echo VITE_BACKEND_URL=http://localhost:5001
echo.
echo Now run: npm run dev
echo.
pause
