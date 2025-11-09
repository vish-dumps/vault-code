@echo off
echo ========================================
echo Fixing React Duplicate Issues
echo ========================================
echo.

echo Step 1: Cleaning node_modules and cache...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist client\.vite rmdir /s /q client\.vite

echo.
echo Step 2: Clearing npm cache...
call npm cache clean --force

echo.
echo Step 3: Installing dependencies with legacy peer deps...
call npm install --legacy-peer-deps

echo.
echo Step 4: Deduplicating packages...
call npm dedupe

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Now start your dev server with: npm run dev
pause
